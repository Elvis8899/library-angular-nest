import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { RouterModule } from "@angular/router";
import {
  BookRentalEntity,
  BookRentalStatusEnum,
} from "@app/models/bookRental.entity";
import { ListRentalsComponent } from "@app/pages/rentals/listRentals/listRentals.component";
import { CredentialsService } from "@app/services/credentials.service";
import { Logger } from "@app/services/logger.service";
import { RentalService } from "@app/services/rental.http.service";
import { ConfirmDialog } from "@app/shared/components/confirmDialog/confirm.dialog.component";
import { ptBR } from "@app/shared/i18n/translations/pt-BR";
import { MockComponent } from "@app/shared/utils/test/mockComponent";
import { createComponentFactory, Spectator } from "@ngneat/spectator/vitest";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { HotToastService } from "@ngxpert/hot-toast";
import { of, throwError } from "rxjs";

Logger.level = 0;

describe("ListRentalsComponent", () => {
  let spectator: Spectator<ListRentalsComponent>;
  let toastService: HotToastService;
  let httpMock: HttpTestingController;
  const rental = (
    id: string,
    bookName: string,
    fines: BookRentalEntity["fines"]
  ): BookRentalEntity => ({
    id,
    userName: "Ana Souza",
    bookName,
    rentalStatus: BookRentalStatusEnum.Rented,
    overdueDate: "2026-10-13T12:00:00.000Z",
    deliveryDate: null,
    fines,
    createdAt: "2026-10-06T12:00:00.000Z",
    updatedAt: "2026-10-06T12:00:00.000Z",
  });
  const rentals: BookRentalEntity[] = [
    rental("1", "Dom Casmurro", {
      overdue: true,
      fixed: 10,
      days: 3,
      perDayValue: 2,
      total: 16,
    }),
    rental("2", "Iracema", {
      overdue: false,
      fixed: 0,
      days: 0,
      perDayValue: 0,
      total: 0,
    }),
  ];
  const rentalServiceMock = {
    getPaginatedBookRentals: vi.fn(() =>
      of({ data: rentals, count: 2, limit: 10, page: 0 })
    ),
    returnBook: vi.fn(() => of({})),
  };
  const confirmDialogMock = { confirm: vi.fn(() => of(true)) };
  let isAdmin = true;
  const credentialsServiceMock = { isAdmin: () => isAdmin };
  const createComponent = createComponentFactory({
    component: ListRentalsComponent,
    imports: [
      RouterModule.forRoot([{ path: "login", component: MockComponent }]),
      TranslateModule.forRoot(),
    ],
    mocks: [HotToastService],
    providers: [
      { provide: RentalService, useValue: rentalServiceMock },
      { provide: ConfirmDialog, useValue: confirmDialogMock },
      { provide: CredentialsService, useValue: credentialsServiceMock },
      provideHttpClientTesting(),
    ],
  });

  function create() {
    spectator = createComponent();
    httpMock = spectator.inject(HttpTestingController);
    toastService = spectator.inject(HotToastService);
    spectator.detectChanges();
  }

  beforeEach(() => {
    isAdmin = true;
    rentalServiceMock.getPaginatedBookRentals.mockClear();
    rentalServiceMock.returnBook.mockClear();
    confirmDialogMock.confirm.mockClear();
    confirmDialogMock.confirm.mockReturnValue(of(true));
  });

  afterEach(() => {
    httpMock.verify();
  });

  const rows = () => spectator.queryAll("tr.mat-mdc-row");
  const headers = () =>
    spectator
      .queryAll("th.mat-mdc-header-cell")
      .map((header) => header.textContent?.trim());

  it("Should list the rentals with the client for admins", () => {
    // Act
    create();
    // Assert
    expect(spectator.query("h1")).toContainText("Rentals");
    expect(rows()).toHaveLength(2);
    expect(headers()).toContain("Client");
    expect(rows()[0]).toContainText("Ana Souza");
  });

  it("Should hide the client column from clients, who see only theirs", () => {
    // Arrange
    isAdmin = false;
    // Act
    create();
    // Assert
    expect(headers()).not.toContain("Client");
    expect(rows()[0]).not.toContainText("Ana Souza");
  });

  it("Should mark overdue rentals and show their fine", () => {
    // Act
    create();
    // Assert
    expect(rows()[0].querySelector(".chip-error")).toHaveText("Overdue");
    expect(rows()[0].querySelector(".fine")).toHaveText("R$16.00");
    expect(rows()[1].querySelector(".chip-error")).toBeNull();
    expect(rows()[1].querySelector(".no-fine")).toHaveText("—");
  });

  it("Should format dates and fines in the selected language", () => {
    // Arrange
    create();
    const translate = spectator.inject(TranslateService);
    translate.setTranslation("pt-BR", ptBR);
    // Act
    translate.use("pt-BR");
    spectator.detectChanges();
    // Assert
    expect(rows()[0]).toContainText("06/10/2026");
    expect(rows()[0]).toContainText("13/10/2026");
    expect(spectator.component.fineDetailsParams(rentals[0])).toEqual({
      fixed: "R$ 10,00",
      perDay: "R$ 2,00",
      days: 3,
    });
  });

  it("Should explain the fine with the default locale too", () => {
    // Act
    create();
    // Assert
    expect(spectator.component.fineDetailsParams(rentals[0])).toEqual({
      fixed: "R$10.00",
      perDay: "R$2.00",
      days: 3,
    });
  });

  it("Should return a book after confirming", () => {
    // Arrange
    create();
    // Act
    spectator.click("button[name='returnBook']");
    // Assert
    expect(confirmDialogMock.confirm).toHaveBeenCalledWith(
      expect.objectContaining({ messageParams: { book: "Dom Casmurro" } })
    );
    expect(rentalServiceMock.returnBook).toHaveBeenCalledExactlyOnceWith("1");
    expect(toastService.success).toHaveBeenCalledTimes(1);
    expect(rentalServiceMock.getPaginatedBookRentals).toHaveBeenCalledTimes(2);
  });

  it("Should not return when the confirmation is cancelled", () => {
    // Arrange
    create();
    confirmDialogMock.confirm.mockReturnValueOnce(of(false));
    // Act
    spectator.click("button[name='returnBook']");
    // Assert
    expect(rentalServiceMock.returnBook).not.toHaveBeenCalled();
  });

  it("Should show the error if returning fails", () => {
    // Arrange
    create();
    rentalServiceMock.returnBook.mockReturnValueOnce(
      throwError(() => new Error("test error"))
    );
    // Act
    spectator.click("button[name='returnBook']");
    // Assert
    expect(toastService.error).toHaveBeenCalledExactlyOnceWith("test error");
  });
});

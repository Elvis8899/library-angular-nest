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
import { Logger } from "@app/services/logger.service";
import { RentalService } from "@app/services/rental.http.service";
import { MockComponent } from "@app/shared/utils/test/mockComponent";
import { createComponentFactory, Spectator } from "@ngneat/spectator/vitest";
import { TranslateModule } from "@ngx-translate/core";
import { HotToastService } from "@ngxpert/hot-toast";
import { of, throwError } from "rxjs";

Logger.level = 0;

describe("ListRentalsComponent", () => {
  let spectator: Spectator<ListRentalsComponent>;
  let toastService: HotToastService;
  let httpMock: HttpTestingController;
  const rentals: BookRentalEntity[] = [
    {
      id: "1",
      userName: "string",
      bookName: "string",
      rentalStatus: BookRentalStatusEnum.Rented,
      overdueDate: new Date().toDateString(),
      deliveryDate: new Date().toDateString(),
      fines: {
        overdue: true,
        fixed: 10,
        days: 1,
        perDayValue: 10,
        total: 20,
      },
      createdAt: new Date().toDateString(),
      updatedAt: new Date().toDateString(),
    },
    {
      id: "2",
      userName: "string",
      bookName: "string",
      rentalStatus: BookRentalStatusEnum.Rented,
      overdueDate: new Date().toDateString(),
      deliveryDate: new Date().toDateString(),
      fines: {
        overdue: false,
        fixed: 0,
        days: 0,
        perDayValue: 0,
        total: 0,
      },
      createdAt: new Date().toDateString(),
      updatedAt: new Date().toDateString(),
    },
  ];
  const rentalServiceMock = {
    getPaginatedBookRentals: vi.fn(() => of({ data: rentals })),
    returnBook: vi.fn(() => of({})),
  };
  const createComponent = createComponentFactory({
    component: ListRentalsComponent,
    imports: [
      RouterModule.forRoot([{ path: "login", component: MockComponent }]),
      TranslateModule.forRoot(),
    ],
    mocks: [HotToastService],
    providers: [
      { provide: RentalService, useValue: rentalServiceMock },
      provideHttpClientTesting(),
    ],
  });

  beforeEach(() => {
    rentalServiceMock.getPaginatedBookRentals.mockClear();
    rentalServiceMock.returnBook.mockClear();
    spectator = createComponent();
    httpMock = spectator.inject(HttpTestingController);
    toastService = spectator.inject(HotToastService);
    spectator.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });
  it("should have subtitle", () => {
    // Assert
    expect(spectator.query("h2")).toContainText("Rentals");
    expect(spectator.queryAll("tr").length).toBe(3);
    expect(toastService.info).toBeCalledTimes(0);
  });

  it("Should return book", () => {
    // Act
    spectator.click("button");
    // Assert
    expect(rentalServiceMock.returnBook).toBeCalledTimes(1);
    expect(toastService.success).toBeCalledTimes(1);
  });

  it("Should show error if return book fails", () => {
    // Arrange
    rentalServiceMock.returnBook.mockReturnValueOnce(
      throwError(() => new Error("test error"))
    );
    // Act
    spectator.click("button");
    // Assert
    expect(rentalServiceMock.returnBook).toBeCalledTimes(1);
    expect(toastService.error).toBeCalledTimes(1);
  });
});

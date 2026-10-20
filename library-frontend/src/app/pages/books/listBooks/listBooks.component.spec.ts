import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import {
  MatButtonToggle,
  MatButtonToggleChange,
  MatButtonToggleGroup,
} from "@angular/material/button-toggle";
import { DateAdapter } from "@angular/material/core";
import {
  MatDatepickerInput,
  MatDatepickerInputEvent,
} from "@angular/material/datepicker";
import { MatDialog } from "@angular/material/dialog";
import { MatSelect, MatSelectChange } from "@angular/material/select";
import { Router, RouterModule } from "@angular/router";
import { BookEntity, BookItemStatusEnum } from "@app/models/book.entity";
import {
  ListBooksComponent,
  noCoverImage,
} from "@app/pages/books/listBooks/listBooks.component";
import { BookService } from "@app/services/book.http.service";
import { CredentialsService } from "@app/services/credentials.service";
import { Logger } from "@app/services/logger.service";
import { RentalService } from "@app/services/rental.http.service";
import { UserService } from "@app/services/user.http.service";
import { ConfirmDialog } from "@app/shared/components/confirmDialog/confirm.dialog.component";
import {
  createComponentFactory,
  createSpyObject,
  Spectator,
  SpyObject,
} from "@ngneat/spectator/vitest";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { HotToastService } from "@ngxpert/hot-toast";
import { of, throwError } from "rxjs";

Logger.level = 0;

describe("ListBooksComponent", () => {
  let spectator: Spectator<ListBooksComponent>;
  let httpMock: HttpTestingController;
  const books: BookEntity[] = [
    {
      id: "1",
      name: "Book Name",
      image: "bookimage.jpg",
      price: 100,
      bookItems: [
        {
          id: "1",
          bookId: "1",
          status: BookItemStatusEnum.Available,
          createdAt: new Date().toDateString(),
          updatedAt: new Date().toDateString(),
        },
        {
          id: "2",
          bookId: "1",
          status: BookItemStatusEnum.Rented,
          createdAt: new Date().toDateString(),
          updatedAt: new Date().toDateString(),
        },
      ],
      createdAt: new Date().toDateString(),
      updatedAt: new Date().toDateString(),
    },
    {
      id: "2",
      name: "Book Name",
      image: "",
      price: 100,
      bookItems: [
        {
          id: "3",
          bookId: "2",
          status: BookItemStatusEnum.Rented,
          createdAt: new Date().toDateString(),
          updatedAt: new Date().toDateString(),
        },
      ],
      createdAt: new Date().toDateString(),
      updatedAt: new Date().toDateString(),
    },
  ];

  const bookServiceMock = createSpyObject(BookService);
  bookServiceMock.getPaginatedBooks.mockReturnValue(
    of({ data: books, count: 2, limit: 10, page: 0 })
  );
  let rentalService: SpyObject<RentalService>;
  const dialogReturn = vi.fn(() => of("1" as string | undefined));
  const matDialogMock = {
    open: vi.fn(() => ({
      afterClosed: dialogReturn,
    })),
  };
  const confirmDialogMock = { confirm: vi.fn(() => of(true)) };
  const createComponent = createComponentFactory({
    component: ListBooksComponent,
    imports: [RouterModule.forRoot([]), TranslateModule.forRoot()],
    providers: [
      provideHttpClientTesting(),
      { provide: BookService, useValue: bookServiceMock },
      { provide: MatDialog, useValue: matDialogMock },
      { provide: ConfirmDialog, useValue: confirmDialogMock },
    ],
    mocks: [
      HotToastService,
      UserService,
      RentalService,
      CredentialsService,
      Router,
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    httpMock = spectator.inject(HttpTestingController);
    rentalService = spectator.inject(RentalService);
    rentalService.rentBook.mockReturnValue(of({}));
    bookServiceMock.addBookItem.mockReset();
    bookServiceMock.addBookItem.mockReturnValue(of(undefined));
    bookServiceMock.deleteBookItem.mockReset();
    bookServiceMock.deleteBookItem.mockReturnValue(of(undefined));
    confirmDialogMock.confirm.mockClear();
    confirmDialogMock.confirm.mockReturnValue(of(true));
    matDialogMock.open.mockClear();
  });

  afterEach(() => {
    httpMock.verify();
  });

  const rows = () => spectator.queryAll("tr.mat-mdc-row");

  it("Should have a title and a row per book", () => {
    // Assert
    expect(spectator.query("h1")).toContainText("Books List");
    expect(rows()).toHaveLength(2);
  });

  it("Should show the price in reais", () => {
    // Assert: the default locale until a language is set
    expect(rows()[0].querySelector("td.numeric")).toHaveText("R$100.00");
  });

  it("Should show the availability", () => {
    // Assert
    expect(rows()[0].querySelector(".chip")).toHaveClass("chip-success");
    expect(rows()[1].querySelector(".chip")).toHaveText("All rented");
  });

  it("Should show a book without copies", () => {
    // Arrange
    spectator.component.data.data$.next([{ ...books[0], bookItems: [] }]);
    spectator.detectChanges();
    // Assert
    expect(rows()[0].querySelector(".chip")).toHaveText("No copies");
  });

  it("Should show the cover, or the placeholder without one", () => {
    // Assert
    const covers = spectator.queryAll<HTMLImageElement>("img.cover");
    expect(covers[0]).toHaveAttribute("src", "bookimage.jpg");
    expect(covers[1]).toHaveAttribute("src", noCoverImage);
  });

  it("Should show the placeholder when a cover doesn't load", () => {
    // Arrange
    const cover = spectator.query<HTMLImageElement>("img.cover")!;
    // Act
    spectator.dispatchFakeEvent(cover, "error");
    // Assert
    expect(cover.src).toContain(noCoverImage);
    // Act: the placeholder failing too doesn't loop
    const src = cover.src;
    spectator.dispatchFakeEvent(cover, "error");
    // Assert
    expect(cover.src).toBe(src);
  });

  it("Should set the date picker's language", () => {
    // Arrange
    // The component's own adapter, from MatNativeDateModule in its imports
    const dateAdapter = spectator.debugElement.injector.get(DateAdapter);
    const setLocaleSpy = vi.spyOn(dateAdapter, "setLocale");
    // Act
    spectator.inject(TranslateService).use("pt-BR");
    // Effects run on the application's tick
    TestBed.tick();
    // Assert
    expect(setLocaleSpy).toHaveBeenCalledWith("pt-BR");
  });

  it("Should query by the typed name", () => {
    // Arrange
    const queryBySpy = vi.spyOn(spectator.component.data, "queryBy");
    // Act
    spectator.typeInElement("Dom Casmurro", "input[name='search']");
    // Assert
    expect(queryBySpy).toHaveBeenLastCalledWith({ name: "Dom Casmurro" });
  });

  it("Should query by the picked creation date", () => {
    // Arrange
    const queryBySpy = vi.spyOn(spectator.component.data, "queryBy");
    const date = new Date(2026, 9, 13);
    // Act
    const datepickerInput = spectator.query(MatDatepickerInput)!;
    datepickerInput.value = date;
    spectator.triggerEventHandler(
      MatDatepickerInput,
      "dateChange",
      new MatDatepickerInputEvent(
        datepickerInput,
        spectator.query("input[name='createdAt']")!
      )
    );
    // Assert
    expect(queryBySpy).toHaveBeenCalledWith({ createdAt: date });
  });

  it("Should let the user change the sort", () => {
    expect(spectator.query(MatSelect)?.disabled).toBe(false);
    expect(spectator.query(MatButtonToggleGroup)?.disabled).toBe(false);
  });

  it("Should sort by the selected property", () => {
    // Arrange
    const sortBySpy = vi.spyOn(spectator.component.data, "sortBy");
    // Act
    spectator.triggerEventHandler(
      MatSelect,
      "selectionChange",
      new MatSelectChange(spectator.query(MatSelect)!, "name")
    );
    // Assert
    expect(sortBySpy).toHaveBeenCalledWith({ property: "name" });
  });

  it("Should sort in the selected order", () => {
    // Arrange
    const sortBySpy = vi.spyOn(spectator.component.data, "sortBy");
    // Act
    spectator.triggerEventHandler(
      MatButtonToggleGroup,
      "change",
      new MatButtonToggleChange(spectator.query(MatButtonToggle)!, "asc")
    );
    // Assert
    expect(sortBySpy).toHaveBeenCalledWith({ order: "asc" });
  });

  it("Should disable renting a book with no copy available", () => {
    // Assert
    const rentButtons = spectator.queryAll("button[name='rentBook']");
    expect(rentButtons[0]).not.toBeDisabled();
    expect(rentButtons[1]).toBeDisabled();
  });

  it("Should tell when there is no copy to rent", () => {
    // Arrange
    const toastService = spectator.inject(HotToastService);
    // Act
    spectator.component.openRentBookDialog(books[1]);
    // Assert
    expect(toastService.error).toHaveBeenCalledTimes(1);
    expect(rentalService.rentBook).not.toHaveBeenCalled();
  });

  describe("When client", () => {
    beforeEach(() => {
      const credentialsService = spectator.inject(CredentialsService);
      credentialsService.isAdmin.mockReturnValue(false);
      credentialsService.userId.mockReturnValue("client-id");
      spectator.detectChanges();
    });

    it("Should rent for themselves after confirming", () => {
      // Act
      spectator.click("button[name='rentBook']");
      // Assert
      expect(confirmDialogMock.confirm).toHaveBeenCalledWith(
        expect.objectContaining({ messageParams: { book: "Book Name" } })
      );
      expect(matDialogMock.open).not.toHaveBeenCalled();
      expect(rentalService.rentBook).toHaveBeenCalledExactlyOnceWith({
        bookItemId: "1",
        userId: "client-id",
      });
      expect(spectator.inject(HotToastService).success).toHaveBeenCalled();
    });

    it("Should not rent when the confirmation is cancelled", () => {
      // Arrange
      confirmDialogMock.confirm.mockReturnValueOnce(of(false));
      // Act
      spectator.click("button[name='rentBook']");
      // Assert
      expect(rentalService.rentBook).not.toHaveBeenCalled();
    });

    it("Should show the error when renting fails", () => {
      // Arrange
      const toastService = spectator.inject(HotToastService);
      rentalService.rentBook.mockReturnValue(
        throwError(() => new Error("Error"))
      );
      // Act
      spectator.click("button[name='rentBook']");
      // Assert
      expect(toastService.error).toHaveBeenCalledExactlyOnceWith("Error");
    });

    it("Should not have admin buttons", () => {
      // Assert
      expect(spectator.query("button[name='createBook']")).toBeNull();
      expect(spectator.query("button[name='addBook']")).toBeNull();
      expect(spectator.query("button[name='removeBook']")).toBeNull();
    });
  });

  describe("When admin", () => {
    beforeEach(() => {
      const credentialsService = spectator.inject(CredentialsService);
      credentialsService.isAdmin.mockReturnValue(true);
      spectator.detectChanges();
    });

    it("Should rent for the client picked in the dialog", () => {
      // Act
      spectator.click("button[name='rentBook']");
      // Assert
      expect(matDialogMock.open).toHaveBeenCalledTimes(1);
      expect(rentalService.rentBook).toHaveBeenCalledExactlyOnceWith({
        bookItemId: "1",
        userId: "1",
      });
    });

    it("Should not rent when the dialog is closed", () => {
      // Arrange
      dialogReturn.mockReturnValueOnce(of(undefined));
      // Act
      spectator.click("button[name='rentBook']");
      // Assert
      expect(rentalService.rentBook).not.toHaveBeenCalled();
    });

    it("On createBook click, should go to add book page", () => {
      // Act
      spectator.click("button[name='createBook']");
      // Assert
      expect(spectator.inject(Router).navigateByUrl).toHaveBeenCalledWith(
        "/books/add"
      );
    });

    it("Should add a copy", () => {
      // Act
      spectator.click("button[name='addBook']");
      // Assert
      expect(bookServiceMock.addBookItem).toHaveBeenCalledExactlyOnceWith({
        bookId: "1",
      });
      expect(spectator.inject(HotToastService).success).toHaveBeenCalled();
    });

    it("Should remove an available copy after confirming", () => {
      // Act
      spectator.click("button[name='removeBook']");
      // Assert
      expect(confirmDialogMock.confirm).toHaveBeenCalledWith(
        expect.objectContaining({ destructive: true })
      );
      expect(bookServiceMock.deleteBookItem).toHaveBeenCalledExactlyOnceWith(
        "1"
      );
      expect(spectator.inject(HotToastService).success).toHaveBeenCalled();
    });

    it("Should not remove a copy when the confirmation is cancelled", () => {
      // Arrange
      confirmDialogMock.confirm.mockReturnValueOnce(of(false));
      // Act
      spectator.click("button[name='removeBook']");
      // Assert
      expect(bookServiceMock.deleteBookItem).not.toHaveBeenCalled();
    });

    it("Should show the error when adding or removing a copy fails", () => {
      // Arrange
      const toastService = spectator.inject(HotToastService);
      bookServiceMock.addBookItem.mockReturnValueOnce(
        throwError(() => new Error("Add error"))
      );
      bookServiceMock.deleteBookItem.mockReturnValueOnce(
        throwError(() => new Error("Remove error"))
      );
      // Act
      spectator.click("button[name='addBook']");
      spectator.click("button[name='removeBook']");
      // Assert
      expect(toastService.error).toHaveBeenCalledWith("Add error");
      expect(toastService.error).toHaveBeenCalledWith("Remove error");
    });

    it("Should not remove a copy when none is available", () => {
      // Arrange
      const toastService = spectator.inject(HotToastService);
      // Assert
      expect(spectator.queryLast("button[name='removeBook']")).toBeDisabled();
      // Act
      spectator.component.removeBookItem(books[1]);
      // Assert
      expect(toastService.error).toHaveBeenCalledTimes(1);
      expect(confirmDialogMock.confirm).not.toHaveBeenCalled();
      expect(bookServiceMock.deleteBookItem).not.toHaveBeenCalled();
    });
  });
});

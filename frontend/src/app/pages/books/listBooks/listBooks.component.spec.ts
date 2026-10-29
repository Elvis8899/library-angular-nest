import { BreakpointObserver, BreakpointState } from "@angular/cdk/layout";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { ApplicationRef } from "@angular/core";
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
import {
  BookEntity,
  BookItemStatus,
  noCoverImage,
} from "@app/pages/books/book.entity";
import { BookService } from "@app/pages/books/book.http.service";
import { ListBooksComponent } from "@app/pages/books/listBooks/listBooks.component";
import { RentalService } from "@app/pages/rentals/rental.http.service";
import { CredentialsService } from "@app/services/credentials.service";
import {
  LiveUpdatesService,
  RESOURCE,
  ResourceChange,
} from "@app/services/liveUpdates.service";
import { Logger, LogLevel } from "@app/services/logger.service";
import { NotificationService } from "@app/services/notification.service";
import { UserService } from "@app/services/user.http.service";
import { ConfirmDialog } from "@app/shared/components/confirmDialog/confirm.dialog.component";
import { provideTranslateService, TranslateService } from "@ngx-translate/core";
import {
  createComponentFactory,
  createSpyObject,
  Spectator,
  SpyObject,
} from "@openng/spectator/vitest";
import { BehaviorSubject, of, Subject, throwError } from "rxjs";

Logger.level = LogLevel.Off;

describe("ListBooksComponent", () => {
  let spectator: Spectator<ListBooksComponent>;
  let httpMock: HttpTestingController;
  const books: BookEntity[] = [
    {
      id: "1",
      name: "Book Name",
      cover: null,
      price: 100,
      bookItems: [
        {
          id: "1",
          bookId: "1",
          status: BookItemStatus.Available,
          createdAt: new Date().toDateString(),
          updatedAt: new Date().toDateString(),
        },
        {
          id: "2",
          bookId: "1",
          status: BookItemStatus.Rented,
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
      cover: null,
      price: 100,
      bookItems: [
        {
          id: "3",
          bookId: "2",
          status: BookItemStatus.Rented,
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
    of({ data: books, count: 2, limit: 10, page: 0 }),
  );
  let rentalService: SpyObject<RentalService>;
  const dialogReturn = vi.fn(() => of("1" as string | undefined));
  const matDialogMock = {
    open: vi.fn(() => ({
      afterClosed: dialogReturn,
    })),
  };
  const confirmDialogMock = { confirm: vi.fn(() => of(true)) };
  // A new one per test, so components from earlier tests don't hold it
  let breakpoints: BehaviorSubject<BreakpointState>;
  // What the socket says changed elsewhere
  const changed = new Subject<ResourceChange>();
  const liveUpdatesMock = { changes: vi.fn(() => changed.asObservable()) };
  const createComponent = createComponentFactory({
    component: ListBooksComponent,
    imports: [RouterModule.forRoot([])],
    providers: [
      provideTranslateService(),
      provideHttpClientTesting(),
      { provide: LiveUpdatesService, useValue: liveUpdatesMock },
      { provide: BookService, useValue: bookServiceMock },
      { provide: MatDialog, useValue: matDialogMock },
      { provide: ConfirmDialog, useValue: confirmDialogMock },
      {
        provide: BreakpointObserver,
        useFactory: () => ({ observe: () => breakpoints }),
      },
    ],
    mocks: [
      NotificationService,
      UserService,
      RentalService,
      CredentialsService,
      Router,
    ],
  });

  beforeEach(() => {
    breakpoints = new BehaviorSubject<BreakpointState>({
      matches: false,
      breakpoints: {},
    });
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

  it("Should reload when someone else changes the list", () => {
    // Arrange: the list has loaded
    const loads = bookServiceMock.getPaginatedBooks.mock.calls.length;
    // Act
    changed.next({ resource: RESOURCE.BOOKS });
    // Assert
    expect(liveUpdatesMock.changes).toHaveBeenCalledWith(RESOURCE.BOOKS);
    expect(bookServiceMock.getPaginatedBooks).toHaveBeenCalledTimes(loads + 1);
  });

  it("Should have a title and a row per book", () => {
    // Assert
    expect(spectator.query("h1")).toContainText("books.list.title");
    expect(rows()).toHaveLength(2);
  });

  it("Should show the price in reais", () => {
    // Assert: the default locale until a language is set
    expect(rows()[0].querySelector("td.numeric")).toHaveText("R$100.00");
  });

  it("Should show the price and availability under the name on small screens", () => {
    // Act
    breakpoints.next({ matches: true, breakpoints: {} });
    spectator.detectChanges();
    // Assert
    expect(
      spectator.queryAll("th").map((th) => th.textContent?.trim()),
    ).toEqual(["common.book", "common.actions"]);
    expect(rows()[0].querySelector(".secondary")).toHaveText("R$100.00");
    expect(rows()[0].querySelector(".book-text .chip")).toHaveClass(
      "chip-success",
    );
  });

  it("Should show the availability", () => {
    // Assert
    expect(rows()[0].querySelector(".chip")).toHaveClass("chip-success");
    expect(rows()[1].querySelector(".chip")).toHaveText(
      "books.availability.allRented",
    );
  });

  it("Should show a book without copies", () => {
    // Arrange
    spectator.component.data.data$.next([{ ...books[0], bookItems: [] }]);
    spectator.detectChanges();
    // Assert
    expect(rows()[0].querySelector(".chip")).toHaveText(
      "books.availability.none",
    );
  });

  it("Should show the cover the API sends, or the placeholder without one", () => {
    // Arrange
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:cover");
    spectator.component.data.data$.next([
      { ...books[0], cover: "v1" },
      books[1],
    ]);
    spectator.detectChanges();
    // Act
    httpMock.expectOne("/v1/bookInfos/1/cover?v=v1").flush(new Blob(["png"]));
    spectator.detectChanges();
    // Assert
    const covers = spectator.queryAll<HTMLImageElement>("img.cover");
    expect(covers[0]).toHaveAttribute("src", "blob:cover");
    expect(covers[1]).toHaveAttribute("src", noCoverImage);
    // A client's cover is no button
    expect(spectator.query("button[name='coverMenu']")).toBeNull();
    vi.restoreAllMocks();
  });

  it("Should set the date picker's language", () => {
    // Arrange
    // The component's own adapter, from MatNativeDateModule in its imports
    const dateAdapter = spectator.debugElement.injector.get(DateAdapter);
    const setLocaleSpy = vi.spyOn(dateAdapter, "setLocale");
    // Act
    spectator.inject(TranslateService).use("pt-BR");
    // Effects run on the application's tick
    spectator.inject(ApplicationRef).tick();
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
        spectator.query("input[name='createdAt']")!,
      ),
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
      new MatSelectChange(spectator.query(MatSelect)!, "name"),
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
      new MatButtonToggleChange(spectator.query(MatButtonToggle)!, "asc"),
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
    const notifications = spectator.inject(NotificationService);
    // Act
    spectator.component.openRentBookDialog(books[1]);
    // Assert
    expect(notifications.error).toHaveBeenCalledExactlyOnceWith(
      "rentals.rent.noneAvailable",
    );
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
        expect.objectContaining({ messageParams: { book: "Book Name" } }),
      );
      expect(matDialogMock.open).not.toHaveBeenCalled();
      expect(rentalService.rentBook).toHaveBeenCalledExactlyOnceWith({
        bookItemId: "1",
        userId: "client-id",
      });
      expect(spectator.inject(NotificationService).success).toHaveBeenCalled();
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
      const notifications = spectator.inject(NotificationService);
      rentalService.rentBook.mockReturnValue(
        throwError(() => new Error("Error")),
      );
      // Act
      spectator.click("button[name='rentBook']");
      // Assert
      expect(notifications.errorMessage).toHaveBeenCalledExactlyOnceWith(
        "Error",
      );
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

    describe("covers", () => {
      const png = new File(["png"], "capa.png", { type: "image/png" });
      const coverInput = () =>
        spectator.query<HTMLInputElement>("input[name='cover']")!;
      const openMenu = () => {
        spectator.click("button[name='coverMenu']");
        spectator.inject(ApplicationRef).tick();
      };
      const pick = (file: File | null) => {
        Object.defineProperty(coverInput(), "files", {
          value: file ? [file] : [],
          configurable: true,
        });
        spectator.dispatchFakeEvent(coverInput(), "change");
      };

      beforeEach(() => {
        bookServiceMock.changeCover.mockReset();
        bookServiceMock.changeCover.mockReturnValue(of(undefined));
        bookServiceMock.removeCover.mockReset();
        bookServiceMock.removeCover.mockReturnValue(of(undefined));
      });

      it("Should upload the cover picked from the cover's menu", () => {
        // Arrange
        const clicked = vi.spyOn(coverInput(), "click");
        const notifications = spectator.inject(NotificationService);
        // Act
        openMenu();
        spectator.click(
          spectator.query("button[name='changeCover']", { root: true })!,
        );
        pick(png);
        // Assert
        expect(clicked).toHaveBeenCalledOnce();
        expect(bookServiceMock.changeCover).toHaveBeenCalledExactlyOnceWith(
          "1",
          png,
        );
        expect(notifications.success).toHaveBeenCalledWith(
          "books.cover.changed",
        );
        // Without a cover there's none to remove
        openMenu();
        expect(
          spectator.query("button[name='removeCover']", { root: true }),
        ).toBeNull();
      });

      it("Should refuse a file the API would, and pick nothing without a book or a file", () => {
        // Arrange
        const notifications = spectator.inject(NotificationService);
        // Act: no book picked for yet, then no file
        spectator.component.uploadCover(new Event("change"));
        pick(png);
        spectator.component.pickCover(books[0], coverInput());
        pick(null);
        pick(new File(["%PDF"], "capa.pdf", { type: "application/pdf" }));
        // Assert
        expect(notifications.error).toHaveBeenCalledExactlyOnceWith(
          "books.form.coverType",
        );
        expect(bookServiceMock.changeCover).not.toHaveBeenCalled();
      });

      it("Should show the API's message when the upload fails", () => {
        // Arrange
        const notifications = spectator.inject(NotificationService);
        bookServiceMock.changeCover.mockReturnValue(
          throwError(() => new Error("A capa deve ter até 5 MB.")),
        );
        // Act
        spectator.component.pickCover(books[0], coverInput());
        pick(png);
        // Assert
        expect(notifications.errorMessage).toHaveBeenCalledWith(
          "A capa deve ter até 5 MB.",
        );
      });

      it("Should remove a cover once confirmed", () => {
        // Arrange
        vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:cover");
        const notifications = spectator.inject(NotificationService);
        spectator.component.data.data$.next([{ ...books[0], cover: "v1" }]);
        spectator.detectChanges();
        httpMock.expectOne("/v1/bookInfos/1/cover?v=v1").flush(new Blob([]));
        // Act
        openMenu();
        spectator.click(
          spectator.query("button[name='removeCover']", { root: true })!,
        );
        // Assert
        expect(confirmDialogMock.confirm).toHaveBeenCalledWith(
          expect.objectContaining({ message: "books.cover.removeConfirm" }),
        );
        expect(bookServiceMock.removeCover).toHaveBeenCalledExactlyOnceWith(
          "1",
        );
        expect(notifications.success).toHaveBeenCalledWith(
          "books.cover.removed",
        );
        // Act: a failure shows the API's message
        bookServiceMock.removeCover.mockReturnValue(
          throwError(() => new Error("Livro sem capa.")),
        );
        spectator.component.removeCover(books[0]);
        // Assert
        expect(notifications.errorMessage).toHaveBeenCalledWith(
          "Livro sem capa.",
        );
        vi.restoreAllMocks();
      });
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
        "/books/add",
      );
    });

    it("Should add a copy", () => {
      // Act
      spectator.click("button[name='addBook']");
      // Assert
      expect(bookServiceMock.addBookItem).toHaveBeenCalledExactlyOnceWith({
        bookId: "1",
      });
      expect(spectator.inject(NotificationService).success).toHaveBeenCalled();
    });

    it("Should remove an available copy after confirming", () => {
      // Act
      spectator.click("button[name='removeBook']");
      // Assert
      expect(confirmDialogMock.confirm).toHaveBeenCalledWith(
        expect.objectContaining({ destructive: true }),
      );
      expect(bookServiceMock.deleteBookItem).toHaveBeenCalledExactlyOnceWith(
        "1",
      );
      expect(spectator.inject(NotificationService).success).toHaveBeenCalled();
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
      const notifications = spectator.inject(NotificationService);
      bookServiceMock.addBookItem.mockReturnValueOnce(
        throwError(() => new Error("Add error")),
      );
      bookServiceMock.deleteBookItem.mockReturnValueOnce(
        throwError(() => new Error("Remove error")),
      );
      // Act
      spectator.click("button[name='addBook']");
      spectator.click("button[name='removeBook']");
      // Assert
      expect(notifications.errorMessage).toHaveBeenCalledWith("Add error");
      expect(notifications.errorMessage).toHaveBeenCalledWith("Remove error");
    });

    it("Should put the copy actions in a menu on small screens", () => {
      // Arrange
      breakpoints.next({ matches: true, breakpoints: {} });
      spectator.detectChanges();
      // Assert
      expect(spectator.query("button[name='addBook']")).toBeNull();
      // Act
      spectator.click("button[name='more']");
      spectator.inject(ApplicationRef).tick();
      spectator.click(
        spectator.query("button[name='addBook']", { root: true })!,
      );
      // Assert
      expect(bookServiceMock.addBookItem).toHaveBeenCalledExactlyOnceWith({
        bookId: "1",
      });
      // Act
      spectator.click("button[name='more']");
      spectator.inject(ApplicationRef).tick();
      spectator.click(
        spectator.query("button[name='removeBook']", { root: true })!,
      );
      // Assert
      expect(bookServiceMock.deleteBookItem).toHaveBeenCalledExactlyOnceWith(
        "1",
      );
    });

    it("Should leave removing out of the menu of a book with no available copy", () => {
      // Arrange
      breakpoints.next({ matches: true, breakpoints: {} });
      spectator.detectChanges();
      // Act: the second book's menu
      spectator.click(spectator.queryAll("button[name='more']")[1]);
      spectator.inject(ApplicationRef).tick();
      // Assert
      expect(
        spectator.query("button[name='addBook']", { root: true }),
      ).toExist();
      expect(
        spectator.query("button[name='removeBook']", { root: true }),
      ).toBeNull();
    });

    it("Should not remove a copy when none is available", () => {
      // Arrange
      const notifications = spectator.inject(NotificationService);
      // Assert
      expect(spectator.queryLast("button[name='removeBook']")).toBeDisabled();
      // Act
      spectator.component.removeBookItem(books[1]);
      // Assert
      expect(notifications.error).toHaveBeenCalledExactlyOnceWith(
        "books.copies.noneToRemove",
      );
      expect(confirmDialogMock.confirm).not.toHaveBeenCalled();
      expect(bookServiceMock.deleteBookItem).not.toHaveBeenCalled();
    });
  });
});

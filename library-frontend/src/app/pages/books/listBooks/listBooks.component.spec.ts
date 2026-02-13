import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { MatDialog } from "@angular/material/dialog";
import { Router, RouterModule } from "@angular/router";
import { BookEntity, BookItemStatusEnum } from "@app/models/book.entity";
import { ListBooksComponent } from "@app/pages/books/listBooks/listBooks.component";
import { BookService } from "@app/services/book.http.service";
import { CredentialsService } from "@app/services/credentials.service";
import { Logger } from "@app/services/logger.service";
import { RentalService } from "@app/services/rental.http.service";
import { UserService } from "@app/services/user.http.service";
import {
  createComponentFactory,
  createSpyObject,
  Spectator,
  SpyObject,
} from "@ngneat/spectator/vitest";
import { TranslateModule } from "@ngx-translate/core";
import { HotToastService } from "@ngxpert/hot-toast";
import { of } from "rxjs";

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
      image: "bookimage.jpg",
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
    of({ data: books, count: 1, limit: 10, page: 0 })
  );
  bookServiceMock.addBookItem.mockReturnValue(of(undefined));
  bookServiceMock.deleteBookItem.mockReturnValue(of(undefined));
  let rentalService: SpyObject<RentalService>;
  const dialogReturn = vi.fn(() => of("1" as string | undefined));
  const matDialogMock = {
    open: () => ({
      afterClosed: dialogReturn,
    }),
  };
  const createComponent = createComponentFactory({
    component: ListBooksComponent,
    imports: [RouterModule.forRoot([]), TranslateModule.forRoot()],
    providers: [
      provideHttpClientTesting(),
      { provide: BookService, useValue: bookServiceMock },
      {
        provide: MatDialog,
        useValue: matDialogMock,
      },
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
    bookServiceMock.addBookItem.mockClear();
    bookServiceMock.deleteBookItem.mockClear();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it("should have subtitle", () => {
    // Assert
    expect(spectator.query("h2")).toContainText("Books List");
    expect(spectator.queryAll("tr").length).toBe(3);
    //spectator.selectOption
  });

  it("Should show error message on errors", () => {
    const toastService = spectator.inject(HotToastService);
    spectator.component.defaultErrorHandler(new Error("Error"));
    expect(toastService.error).toHaveBeenCalledTimes(1);
    expect(toastService.error).toHaveBeenCalledWith("Error");
  });

  describe("When client", () => {
    beforeEach(() => {
      const authService = spectator.inject(CredentialsService);
      authService.isAdmin.mockReturnValue(false);
    });

    it("Rent button should be available", () => {
      // Assert
      expect(spectator.query("button[name='rentBook']")).toBeTruthy();
      expect(spectator.query("button[name='rentBook']")).not.toBeDisabled();
    });

    it("On rent button click, should rent book", () => {
      // Assert
      spectator.click("button[name='rentBook']");
      spectator.detectChanges();
    });

    it("Should not have admin buttons", () => {
      // Assert
      expect(spectator.query("button[name='addBook']")).toBeNull();
      expect(spectator.query("button[name='removeBook']")).toBeNull();
    });
  });
  describe("When admin", () => {
    beforeEach(() => {
      const authService = spectator.inject(CredentialsService);
      authService.isAdmin.mockReturnValue(true);
      spectator.detectChanges();
    });

    it("Rent button should be available", () => {
      // Assert
      expect(spectator.query("button[name='rentBook']")).toBeTruthy();
      expect(spectator.query("button[name='rentBook']")).not.toBeDisabled();
    });

    it("On rent button click and modal select, should rent book", () => {
      // Act
      spectator.click("button[name='rentBook']");
      spectator.detectChanges();
      // Assert
      expect(rentalService.rentBook).toHaveBeenCalledTimes(1);
    });

    it("On rent button click and modal close, should not rent book", () => {
      // Arrange
      dialogReturn.mockReturnValueOnce(of(undefined));
      // Act
      spectator.click("button[name='rentBook']");
      spectator.detectChanges();
      // Assert
      expect(rentalService.rentBook).toHaveBeenCalledTimes(0);
    });

    it("If rent is called with unavailable book, should show error", () => {
      const toastService = spectator.inject(HotToastService);
      // Act
      spectator.component.openRentBookDialog(books[1]);

      expect(toastService.error).toHaveBeenCalledTimes(1);
    });
    it("Should have admin buttons", () => {
      // Assert
      expect(spectator.query("button[name='addBook']")).toBeTruthy();
      expect(spectator.query("button[name='removeBook']")).toBeTruthy();
    });

    it("On createBook click, should go to add book page", () => {
      const router = spectator.inject(Router);
      // Assert
      spectator.click("button[name='createBook']");
      spectator.detectChanges();
      expect(router.navigateByUrl).toBeCalledWith("/books/add");
    });

    it("Should add bookItem", () => {
      // Assert
      spectator.click("button[name='addBook']");
      expect(bookServiceMock.addBookItem).toHaveBeenCalledTimes(1);
    });

    it("Should remove bookItem", () => {
      // Assert
      spectator.click("button[name='removeBook']");
      expect(bookServiceMock.deleteBookItem).toHaveBeenCalledTimes(1);
    });

    it("Should not remove bookItem if none available", () => {
      // Assert
      spectator
        .queryLast("button[name='removeBook']")
        ?.dispatchEvent(new Event("click"));
      //spectator.click("button[name='removeBook']");
      expect(bookServiceMock.deleteBookItem).toHaveBeenCalledTimes(0);
    });
  });
});

import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { MatDialog } from "@angular/material/dialog";
import { RouterModule } from "@angular/router";
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
  ];

  const bookServiceMock = createSpyObject(BookService);
  bookServiceMock.getPaginatedBooks.mockReturnValue(
    of({ data: books, count: 1, limit: 10, page: 0 })
  );
  let rentalService: SpyObject<RentalService>;

  const createComponent = createComponentFactory({
    component: ListBooksComponent,
    imports: [RouterModule.forRoot([]), TranslateModule.forRoot()],
    providers: [
      provideHttpClientTesting(),
      { provide: BookService, useValue: bookServiceMock },
      {
        provide: MatDialog,
        useValue: {
          open: () => ({
            afterClosed: () => of("1"),
          }),
        },
      },
    ],
    mocks: [HotToastService, UserService, RentalService, CredentialsService],
  });

  beforeEach(() => {
    spectator = createComponent();
    httpMock = spectator.inject(HttpTestingController);
    rentalService = spectator.inject(RentalService);
    rentalService.rentBook.mockReturnValue(of({}));
  });

  afterEach(() => {
    httpMock.verify();
  });

  it("should have subtitle", () => {
    // Assert
    expect(spectator.query("h2")).toContainText("Books List");
    expect(spectator.queryAll("tr").length).toBe(2);
    //spectator.selectOption
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
  });
  describe("When admin", () => {
    beforeEach(() => {
      const authService = spectator.inject(CredentialsService);
      authService.isAdmin.mockReturnValue(true);
    });

    it("Rent button should be available", () => {
      // Assert
      expect(spectator.query("button[name='rentBook']")).toBeTruthy();
      expect(spectator.query("button[name='rentBook']")).not.toBeDisabled();
    });

    it("On rent button click, should open modal", () => {
      // Assert
      spectator.click("button[name='rentBook']");
      spectator.detectChanges();
    });
  });
});

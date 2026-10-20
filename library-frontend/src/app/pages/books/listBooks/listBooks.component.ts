import { CurrencyPipe, NgTemplateOutlet } from "@angular/common";
import { Component, computed, effect, inject, OnInit } from "@angular/core";
import { MatButton, MatIconButton } from "@angular/material/button";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { DateAdapter, MatNativeDateModule } from "@angular/material/core";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIcon } from "@angular/material/icon";
import { MatInput } from "@angular/material/input";
import { MatMenuModule } from "@angular/material/menu";
import { MatSelectModule } from "@angular/material/select";
import { MatTableModule } from "@angular/material/table";
import { MatTooltip } from "@angular/material/tooltip";
import { Router } from "@angular/router";
import {
  BookEntity,
  BookItemStatusEnum,
  BookQuery,
} from "@app/models/book.entity";
import { BookRentEntity } from "@app/models/bookRental.entity";
import { PaginatedDataSource } from "@app/models/utils/paginatedDataSource.entity";
import { ChooseUserDialogComponent } from "@app/pages/books/listBooks/chooseUserDialog/chooseUser.dialog.component";
import { BookService } from "@app/services/book.http.service";
import { CredentialsService } from "@app/services/credentials.service";
import { Logger } from "@app/services/logger.service";
import { RentalService } from "@app/services/rental.http.service";
import { ConfirmDialog } from "@app/shared/components/confirmDialog/confirm.dialog.component";
import { CustomizedTableComponent } from "@app/shared/components/customizedTable/customizedTable.component";
import { TypedDialog } from "@app/shared/components/dialog/typedDialog";
import { PageHeaderComponent } from "@app/shared/components/pageHeader/pageHeader.component";
import { injectIsSmallScreen } from "@app/shared/helpers/smallScreen";
import { injectCurrentLocale } from "@app/shared/i18n/currentLocale";
import { t } from "@app/shared/i18n/translations/translationKey";
import { TranslatePipe, TranslateService } from "@ngx-translate/core";
import { HotToastService } from "@ngxpert/hot-toast";
import { filter } from "rxjs";

const log = new Logger("ListBooksComponent");

export const noCoverImage = "images/no-image.png";

@Component({
  selector: "app-list-books",
  templateUrl: "./listBooks.component.html",
  styleUrl: "./listBooks.component.scss",
  imports: [
    CurrencyPipe,
    NgTemplateOutlet,
    MatButton,
    MatIconButton,
    MatButtonToggleModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatIcon,
    MatInput,
    MatMenuModule,
    MatSelectModule,
    MatTableModule,
    MatTooltip,
    CustomizedTableComponent,
    PageHeaderComponent,
    TranslatePipe,
  ],
})
export class ListBooksComponent implements OnInit {
  data!: PaginatedDataSource<BookEntity, BookQuery>;

  readonly dialog = inject(TypedDialog);
  readonly locale = injectCurrentLocale();
  readonly isSmallScreen = injectIsSmallScreen();
  // Small screens show the price and availability under the book's name
  readonly columns = computed(() =>
    this.isSmallScreen()
      ? ["book", "actions"]
      : ["book", "price", "availability", "actions"]
  );
  readonly noCoverImage = noCoverImage;

  private readonly _bookService = inject(BookService);
  private readonly _rentalService = inject(RentalService);
  private readonly _router = inject(Router);
  private readonly _credentialsService = inject(CredentialsService);
  private readonly _confirmDialog = inject(ConfirmDialog);
  private readonly _toast = inject(HotToastService);
  private readonly _translate = inject(TranslateService);

  constructor() {
    // The date filter's picker shows dates in the selected language
    const dateAdapter = inject(DateAdapter);
    effect(() => {
      const locale = this.locale();
      if (locale) dateAdapter.setLocale(locale);
    });
  }

  ngOnInit(): void {
    this.data = new PaginatedDataSource<BookEntity, BookQuery>(
      (request) => this._bookService.getPaginatedBooks(request),
      {
        log: log,
        query: { name: "" },
        sort: {
          property: "createdAt",
          order: "desc",
        },
        displayedColumns: ["book", "price", "availability", "actions"],
      }
    );
  }

  openRentBookDialog(book: BookEntity) {
    const bookItem = this._availableItem(book);
    if (!bookItem) {
      this._toast.error(
        this._translate.instant(t("rentals.rent.noneAvailable"))
      );
      return;
    }
    const bookItemId = bookItem.id;
    if (!this.isAdmin()) {
      // Clients rent for themselves; a fine applies once it's overdue
      this._confirmDialog
        .confirm({
          title: "rentals.rent.title",
          message: "rentals.rent.confirm",
          messageParams: { book: book.name },
          confirmLabel: "rentals.rent.action",
        })
        .pipe(filter(Boolean))
        .subscribe(() =>
          this.rentBook({
            bookItemId,
            userId: this._credentialsService.userId(),
          })
        );
      return;
    }
    const dialogRef = this.dialog.open(ChooseUserDialogComponent, {
      data: {
        book,
      },
      width: "440px",
    });
    dialogRef.afterClosed().subscribe((userId: string | undefined) => {
      if (userId !== undefined) {
        this.rentBook({
          bookItemId: bookItemId,
          userId,
        });
      }
    });
  }

  refresh() {
    this.data.refresh();
  }

  availableCount(book: BookEntity) {
    return book.bookItems.filter(
      (item) => item.status === BookItemStatusEnum.Available
    ).length;
  }

  availabilityParams(book: BookEntity) {
    return {
      available: this.availableCount(book),
      total: book.bookItems.length,
    };
  }

  isBookAvailable(book: BookEntity) {
    return this.availableCount(book) > 0;
  }

  // Shows the placeholder when a cover's URL doesn't load
  onCoverError(event: Event) {
    const image = event.target as HTMLImageElement;
    if (!image.src.endsWith(noCoverImage)) image.src = noCoverImage;
  }

  goToAddBook() {
    this._router.navigateByUrl("/books/add");
  }

  rentBook(book: BookRentEntity) {
    this._rentalService.rentBook(book).subscribe({
      next: () => {
        this._toast.success(this._translate.instant(t("rentals.rent.done")));
        this.refresh();
      },
      error: this.defaultErrorHandler,
    });
  }

  addBookItem(book: BookEntity) {
    this._bookService.addBookItem({ bookId: book.id }).subscribe({
      next: () => {
        this._toast.success(this._translate.instant(t("books.copies.added")));
        this.refresh();
      },
      error: this.defaultErrorHandler,
    });
  }

  removeBookItem(book: BookEntity) {
    const bookItem = this._availableItem(book);
    if (!bookItem) {
      this._toast.error(
        this._translate.instant(t("books.copies.noneToRemove"))
      );
      return;
    }
    this._confirmDialog
      .confirm({
        title: "books.copies.remove",
        message: "books.copies.removeConfirm",
        messageParams: { book: book.name },
        confirmLabel: "common.remove",
        destructive: true,
      })
      .pipe(filter(Boolean))
      .subscribe(() =>
        this._bookService.deleteBookItem(bookItem.id).subscribe({
          next: () => {
            this._toast.success(
              this._translate.instant(t("books.copies.removed"))
            );
            this.refresh();
          },
          error: this.defaultErrorHandler,
        })
      );
  }

  // An arrow function, so `this` is still the component when RxJS calls it
  readonly defaultErrorHandler = (error: Error) => {
    this._toast.error(error?.message);
    log.error(error);
  };

  isAdmin() {
    return this._credentialsService.isAdmin();
  }

  private _availableItem(book: BookEntity) {
    return book.bookItems.find(
      (item) => item.status === BookItemStatusEnum.Available
    );
  }
}

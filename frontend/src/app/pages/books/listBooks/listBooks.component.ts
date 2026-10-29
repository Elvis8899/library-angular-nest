import { NgTemplateOutlet } from "@angular/common";
import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  OnInit,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { MatButton, MatIconButton } from "@angular/material/button";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { DateAdapter, MatNativeDateModule } from "@angular/material/core";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIcon } from "@angular/material/icon";
import { MatInput } from "@angular/material/input";
import {
  MatMenu,
  MatMenuContent,
  MatMenuItem,
  MatMenuTrigger,
} from "@angular/material/menu";
import { MatSelectModule } from "@angular/material/select";
import { MatTableModule } from "@angular/material/table";
import { MatTooltip } from "@angular/material/tooltip";
import { Router } from "@angular/router";
import {
  BookEntity,
  BookItemStatus,
  BookQuery,
  coverPath,
  coverProblem,
  coverTypes,
  noCoverImage,
} from "@app/pages/books/book.entity";
import { BookService } from "@app/pages/books/book.http.service";
import { ChooseUserDialogComponent } from "@app/pages/books/listBooks/chooseUserDialog/chooseUser.dialog.component";
import { BookRentEntity } from "@app/pages/rentals/bookRental.entity";
import { RentalService } from "@app/pages/rentals/rental.http.service";
import { CredentialsService } from "@app/services/credentials.service";
import {
  LiveUpdatesService,
  RESOURCE,
} from "@app/services/liveUpdates.service";
import { Logger } from "@app/services/logger.service";
import { NotificationService } from "@app/services/notification.service";
import { ConfirmDialog } from "@app/shared/components/confirmDialog/confirm.dialog.component";
import { CustomizedTableComponent } from "@app/shared/components/customizedTable/customizedTable.component";
import { PaginatedDataSource } from "@app/shared/components/customizedTable/paginatedDataSource";
import { PageHeaderComponent } from "@app/shared/components/pageHeader/pageHeader.component";
import {
  RowAction,
  RowActionsComponent,
} from "@app/shared/components/rowActions/rowActions.component";
import { AuthSrcDirective } from "@app/shared/directives/authSrc.directive";
import { CellDefDirective } from "@app/shared/directives/cellDef.directive";
import {
  templateContext,
  TemplateContextDirective,
} from "@app/shared/directives/templateContext.directive";
import { injectCurrentLocale } from "@app/shared/i18n/currentLocale";
import { t } from "@app/shared/i18n/translations/translationKey";
import { MoneyPipe } from "@app/shared/pipes/number.pipes";
import { injectSaving } from "@app/shared/utils/saving.utility";
import { injectIsSmallScreen } from "@app/shared/utils/smallScreen.utility";
import { TypedDialog } from "@app/shared/utils/typedDialog.utility";
import { TranslatePipe } from "@ngx-translate/core";
import { filter } from "rxjs";

const log = new Logger("ListBooksComponent");

const coverProblems = {
  type: t("books.form.coverType"),
  size: t("books.form.coverTooLarge"),
};

@Component({
  selector: "app-list-books",
  templateUrl: "./listBooks.component.html",
  styleUrl: "./listBooks.component.scss",
  imports: [
    AuthSrcDirective,
    CellDefDirective,
    TemplateContextDirective,
    MoneyPipe,
    NgTemplateOutlet,
    MatButton,
    MatIconButton,
    MatButtonToggleModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatIcon,
    MatInput,
    MatMenu,
    MatMenuContent,
    MatMenuItem,
    MatMenuTrigger,
    RowActionsComponent,
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
  // Types the row templates' let-book
  readonly rowContext = templateContext<{ $implicit: BookEntity }>();

  readonly dialog = inject(TypedDialog);
  readonly locale = injectCurrentLocale();
  readonly isSmallScreen = injectIsSmallScreen();
  // Small screens show the price and availability under the book's name
  readonly columns = computed(() =>
    this.isSmallScreen()
      ? ["book", "actions"]
      : ["book", "price", "availability", "actions"],
  );
  // The row actions' requests, one at a time, with the API's message on a
  // failure
  readonly saving = injectSaving(log);
  readonly noCoverImage = noCoverImage;
  readonly coverPath = coverPath;
  readonly coverTypes = coverTypes.join(",");
  // The book whose cover the file picker changes
  private _coverBook: BookEntity | null = null;

  private readonly _liveUpdates = inject(LiveUpdatesService);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _bookService = inject(BookService);
  private readonly _rentalService = inject(RentalService);
  private readonly _router = inject(Router);
  private readonly _credentialsService = inject(CredentialsService);
  private readonly _confirmDialog = inject(ConfirmDialog);
  private readonly _notify = inject(NotificationService);

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
      },
    );
    // What someone else changes shows here too, a rental's copy included
    this._liveUpdates
      .changes(RESOURCE.BOOKS)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(() => this.refresh());
  }

  openRentBookDialog(book: BookEntity) {
    const bookItem = this._availableItem(book);
    if (!bookItem) {
      this._notify.error("rentals.rent.noneAvailable");
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
          }),
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
      (item) => item.status === BookItemStatus.Available,
    ).length;
  }

  availabilityParams(book: BookEntity) {
    return {
      available: this.availableCount(book),
      total: book.bookItems.length,
    };
  }

  // The copy actions, in the row's ⋮ menu on small screens
  readonly copyActions: readonly RowAction<BookEntity>[] = [
    {
      name: "addBook",
      icon: "library_add",
      label: t("books.copies.add"),
      run: (book) => this.addBookItem(book),
    },
    {
      name: "removeBook",
      icon: "remove_circle_outline",
      label: t("books.copies.remove"),
      run: (book) => this.removeBookItem(book),
      // Only an available copy can go
      shown: (book) => this.isBookAvailable(book),
    },
  ];

  isBookAvailable(book: BookEntity) {
    return this.availableCount(book) > 0;
  }

  /** Opens the file picker for the book's new cover. */
  pickCover(book: BookEntity, input: HTMLInputElement) {
    this._coverBook = book;
    input.click();
  }

  uploadCover(event: Event) {
    const input = event.target;
    const book = this._coverBook;
    if (!(input instanceof HTMLInputElement) || !book) return;
    const file = input.files?.[0];
    // Picking the same file again fires change again
    input.value = "";
    if (!file) return;
    const problem = coverProblem(file);
    if (problem) {
      this._notify.error(coverProblems[problem]);
      return;
    }
    this.saving.run(this._bookService.changeCover(book.id, file), () => {
      this._notify.success("books.cover.changed");
      this.refresh();
    });
  }

  removeCover(book: BookEntity) {
    this._confirmDialog
      .confirm({
        title: "books.cover.remove",
        message: "books.cover.removeConfirm",
        messageParams: { book: book.name },
        confirmLabel: "common.remove",
        destructive: true,
      })
      .pipe(filter(Boolean))
      .subscribe(() =>
        this.saving.run(this._bookService.removeCover(book.id), () => {
          this._notify.success("books.cover.removed");
          this.refresh();
        }),
      );
  }

  goToAddBook() {
    void this._router.navigateByUrl("/books/add");
  }

  rentBook(book: BookRentEntity) {
    this.saving.run(this._rentalService.rentBook(book), () => {
      this._notify.success("rentals.rent.done");
      this.refresh();
    });
  }

  addBookItem(book: BookEntity) {
    this.saving.run(this._bookService.addBookItem({ bookId: book.id }), () => {
      this._notify.success("books.copies.added");
      this.refresh();
    });
  }

  removeBookItem(book: BookEntity) {
    const bookItem = this._availableItem(book);
    if (!bookItem) {
      this._notify.error("books.copies.noneToRemove");
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
        this.saving.run(this._bookService.deleteBookItem(bookItem.id), () => {
          this._notify.success("books.copies.removed");
          this.refresh();
        }),
      );
  }

  isAdmin() {
    return this._credentialsService.isAdmin();
  }

  private _availableItem(book: BookEntity) {
    return book.bookItems.find(
      (item) => item.status === BookItemStatus.Available,
    );
  }
}

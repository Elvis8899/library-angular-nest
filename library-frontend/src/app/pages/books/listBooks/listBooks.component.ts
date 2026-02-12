import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { MatNativeDateModule } from "@angular/material/core";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatTableModule } from "@angular/material/table";
import { Router } from "@angular/router";
import {
  BookEntity,
  BookItemStatusEnum,
  BookQuery,
} from "@app/models/book.entity";
import { BookRentEntity } from "@app/models/bookRental.entity";
import { UserEntity } from "@app/models/user.entity";
import { PaginatedDataSource } from "@app/models/utils/paginatedDataSource.entity";
import { ChooseUserDialogComponent } from "@app/pages/books/listBooks/chooseUserDialog/chooseUser.dialog.component";
import { BookService } from "@app/services/book.http.service";
import { CredentialsService } from "@app/services/credentials.service";
import { Logger } from "@app/services/logger.service";
import { RentalService } from "@app/services/rental.http.service";
import { CustomizedTableComponent } from "@app/shared/components/customized-table/customized-table.component";
import { TypedDialog } from "@app/shared/components/dialog/typed-dialog";
import { TranslateModule } from "@ngx-translate/core";
import { HotToastService } from "@ngxpert/hot-toast";

const log = new Logger("ListBooksComponent");

@Component({
  selector: "app-list",
  templateUrl: "./listBooks.component.html",
  styleUrl: "./listBooks.component.scss",
  imports: [
    FormsModule,
    MatButtonModule,
    TranslateModule,
    MatTableModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonToggleModule,
    MatDatepickerModule,
    MatNativeDateModule,
    CustomizedTableComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListBooksComponent implements OnInit {
  users: UserEntity[] = [];
  isLoading = true;

  data!: PaginatedDataSource<BookEntity, BookQuery>;

  // readonly user = signal("");
  readonly dialog = inject(TypedDialog);

  private readonly _bookService = inject(BookService);
  private readonly _rentalService = inject(RentalService);
  private readonly _router = inject(Router);
  private readonly _credentialsService = inject(CredentialsService);
  private readonly _toast = inject(HotToastService);

  ngOnInit(): void {
    this.data = new PaginatedDataSource<BookEntity, BookQuery>(
      (request) => this._bookService.getPaginatedBooks(request),
      {
        log: log,
        query: { name: "" },
        sort: {
          property: "createdAt",
          order: "asc",
        },
        displayedColumns: ["image", "name", "price", "availability", "actions"],
      }
    );
  }

  openRentBookDialog(book: BookEntity) {
    if (!this.isAdmin()) {
      return this.rentBook({
        bookItemId:
          book.bookItems.find(
            (item) => item.status === BookItemStatusEnum.Available
          )?.id || "",
        userId: this._credentialsService.userId(),
      });
    }
    const dialogRef = this.dialog.open(ChooseUserDialogComponent, {
      data: {
        book: book,
      },
    });
    dialogRef.afterClosed().subscribe((result: string | undefined) => {
      if (result !== undefined) {
        const bookItemId = book.bookItems.find(
          (item) => item.status === BookItemStatusEnum.Available
        )?.id;
        this.rentBook({
          bookItemId: bookItemId || "",
          userId: result,
        });
      }
    });
  }

  refresh() {
    this.data.refresh();
  }

  bookAvailabilityRatio(book: BookEntity) {
    const total = book.bookItems.length;
    const available = book.bookItems.filter(
      (item) => item.status === BookItemStatusEnum.Available
    ).length;
    return `${available}/${total}`;
  }

  isBookAvailable(book: BookEntity) {
    return book.bookItems.some(
      (item) => item.status === BookItemStatusEnum.Available
    );
  }

  goToAddBook() {
    this._router.navigate(["/books/add"]);
  }

  bookClicked() {
    this._toast.show("Book clicked");
  }

  rentBook(book: BookRentEntity) {
    this._rentalService.rentBook(book).subscribe({
      next: () => {
        this._toast.success("Book rented successfully");
        this.refresh();
      },
      error: (error: Error) => {
        this._toast.error(error?.message);
        log.error(error);
      },
    });
  }
  addBookItem(book: BookEntity) {
    this.isLoading = true;
    this._bookService.addBookItem({ bookId: book.id }).subscribe({
      next: () => {
        this.refresh();
        this.isLoading = false;
      },
      error: (error) => {
        this._toast.error(error?.message);
        log.error(error);
      },
    });
  }
  removeBookItem(book: BookEntity) {
    const id =
      book.bookItems.find(
        (item) => item.status === BookItemStatusEnum.Available
      )?.id || "";
    if (id === "") {
      this._toast.error("Sem livros disponíveis para remoção");
      return;
    }
    this._bookService.deleteBookItem(id).subscribe({
      next: () => {
        this.refresh();
      },
      error: (error) => {
        this._toast.error(error?.message);
        log.error(error);
      },
    });
  }
  isAdmin() {
    return this._credentialsService.isAdmin();
  }
}

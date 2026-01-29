import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  model,
  OnInit,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogActions,
  MatDialogClose,
  MatDialogRef,
  MatDialogTitle,
} from "@angular/material/dialog";
import { Router } from "@angular/router";
import { BookService } from "@app/auth/services/book.service";
import { BookEntity, BookItemStatusEnum, UserEntity } from "@core/entities";
import { HotToastService } from "@ngxpert/hot-toast";

import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { BookRentEntity } from "@app/@core/entities/bookRental.entity";
import { Logger } from "@app/@core/services";
import { CredentialsService, ROLE } from "@app/auth";
import { RentalService } from "@app/auth/services/rental.service";
import { UserService } from "@app/auth/services/user.service";
import { TranslateModule } from "@ngx-translate/core";

const log = new Logger("ListBooksComponent");

export interface DialogData {
  users: UserEntity[];
  book: BookEntity;
  user: UserEntity;
}

@Component({
  selector: "app-list",
  templateUrl: "./listBooks.component.html",
  styleUrl: "./listBooks.component.scss",
  imports: [
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatButtonModule,
    TranslateModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListBooksComponent implements OnInit {
  books: BookEntity[] = [];
  users: UserEntity[] = [];
  isLoading = true;

  // readonly user = signal("");
  readonly dialog = inject(MatDialog);

  private readonly _userService = inject(UserService);
  private readonly _bookService = inject(BookService);
  private readonly _rentalService = inject(RentalService);
  private readonly _router = inject(Router);
  private readonly _credentialsService = inject(CredentialsService);
  private readonly _cd = inject(ChangeDetectorRef);
  private readonly _toast = inject(HotToastService);

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
    const dialogRef = this.dialog.open(DialogOverviewExampleDialogComponent, {
      data: {
        users: this.users.filter((u) => u.role !== ROLE.ADMIN),
        book: book,
      },
    });
    dialogRef.afterClosed().subscribe((result: string) => {
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

  ngOnInit() {
    this.refresh();
  }

  refresh() {
    this._bookService.getPaginatedBooks().subscribe({
      next: (res) => {
        this.books = res.data;
        this.isLoading = false;
        this._cd.detectChanges();
      },
      error: (error) => {
        //    this.isLoading = false;
        log.error(error);
      },
    });
    this._userService.getPaginatedUsers().subscribe({
      next: (res) => {
        this.users = res.data;
        this.isLoading = false;
      },
      error: (error) => {
        log.error(error);
      },
    });
  }

  bookAvailabilityRatio(book: BookEntity) {
    const total = book.bookItems.length;
    const available = book.bookItems.filter(
      (item) => item.status === BookItemStatusEnum.Available
    ).length;
    return `${available}/${total}`;
  }

  isBookAvailable(book: BookEntity) {
    log.info(book);
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

@Component({
  selector: "app-dialog-overview-example-dialog",
  templateUrl: "dialog-overview-example-dialog.html",
  imports: [
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatButtonModule,
    MatSelectModule,
    MatDialogTitle,
    MatDialogActions,
    MatDialogClose,
  ],
})
export class DialogOverviewExampleDialogComponent {
  selectedValue!: UserEntity;
  selectedCar = "";

  readonly dialogRef = inject(
    MatDialogRef<DialogOverviewExampleDialogComponent>
  );
  readonly data = inject<DialogData>(MAT_DIALOG_DATA);
  readonly user = model("");
  onNoClick(): void {
    this.dialogRef.close();
  }
}

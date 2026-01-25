import {
  OnInit,
  ChangeDetectionStrategy,
  Component,
  inject,
  ChangeDetectorRef,
  model,
  // signal,
} from "@angular/core";
import { Router } from "@angular/router";
import { BookService } from "@app/auth/services/book.service";
import { BookEntity, BookItemStatusEnum, UserEntity } from "@core/entities";
import { HotToastService } from "@ngxpert/hot-toast";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import {
  MatDialog,
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogRef,
  MatDialogTitle,
} from "@angular/material/dialog";

import { MatSelectModule } from "@angular/material/select";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { UserService } from "@app/auth/services/user.service";
import { RentalService } from "@app/auth/services/rental.service";
import { BookRentEntity } from "@app/@core/entities/bookRental.entity";
import { ROLE } from "@app/auth";

export interface DialogData {
  users: UserEntity[];
  book: BookEntity;
  user: UserEntity;
}

@Component({
  selector: "app-list",
  templateUrl: "./listBooks.component.html",
  styleUrl: "./listBooks.component.scss",
  imports: [MatFormFieldModule, MatInputModule, FormsModule, MatButtonModule],
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
  private readonly _cd = inject(ChangeDetectorRef);
  private readonly _toast = inject(HotToastService);

  openRentBookDialog(book: BookEntity) {
    const dialogRef = this.dialog.open(DialogOverviewExampleDialogComponent, {
      data: {
        users: this.users.filter((u) => u.role !== ROLE.ADMIN),
        book: book,
      },
    });
    dialogRef.afterClosed().subscribe((result: string) => {
      console.log("The dialog was closed");
      console.log("result", result);
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
        console.error(error);
      },
    });
    this._userService.getPaginatedUsers().subscribe({
      next: (res) => {
        this.users = res.data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error(error);
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
    console.log(book);
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
        console.error(error);
      },
    });
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

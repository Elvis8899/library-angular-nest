import { Component, inject, OnInit } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { BookEntity } from "@app/models/book.entity";
import { BookService } from "@app/services/book.http.service";
import { Logger } from "@app/services/logger.service";
import { HotToastService } from "@ngxpert/hot-toast";

const log = new Logger("AddBookComponent");

@Component({
  selector: "app-list",
  templateUrl: "./addBook.component.html",
  styleUrl: "./addBook.component.scss",
  imports: [ReactiveFormsModule],
})
export class AddBooksComponent implements OnInit {
  private readonly _fb = inject(FormBuilder);

  addBookForm = this._fb.group({
    name: ["", [Validators.required, Validators.minLength(4)]],
    image: ["", [Validators.required, Validators.minLength(4)]],
    price: ["", [Validators.required]],
  });
  private readonly _toast = inject(HotToastService);
  private readonly _bookService = inject(BookService);
  private readonly _router = inject(Router);

  ngOnInit(): void {
    this.addBookForm.reset();
  }

  onSubmit() {
    this._bookService
      .addBook({ ...this.addBookForm?.value } as Partial<BookEntity>)
      .subscribe({
        next: () => {
          this._toast.success("Book created successfully");
          this._router.navigate(["/books/list"]);
        },
        error: (error: Error) => {
          this._toast.error(error?.message);
          log.error(error);
        },
      });
  }

  goToAddBook() {
    this._router.navigate(["/books/add"]);
  }

  bookClicked() {
    this._toast.show("Book clicked");
  }
}

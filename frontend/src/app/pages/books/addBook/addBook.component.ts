import { Component, inject, signal } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButton } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInput } from "@angular/material/input";
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { Router, RouterLink } from "@angular/router";
import { BookService } from "@app/pages/books/book.http.service";
import { Logger } from "@app/services/logger.service";
import { NotificationService } from "@app/services/notification.service";
import { FormCardComponent } from "@app/shared/components/formCard/formCard.component";
import { TranslatePipe } from "@ngx-translate/core";
import { finalize } from "rxjs";

const log = new Logger("AddBookComponent");

const noImage = "images/no-image.png";

@Component({
  selector: "app-add-book",
  templateUrl: "./addBook.component.html",
  styleUrl: "./addBook.component.scss",
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButton,
    MatFormFieldModule,
    MatInput,
    MatProgressSpinner,
    FormCardComponent,
    TranslatePipe,
  ],
})
export class AddBooksComponent {
  private readonly _fb = inject(FormBuilder);
  private readonly _notify = inject(NotificationService);
  private readonly _bookService = inject(BookService);
  private readonly _router = inject(Router);

  // As the API: a name and a price; the cover is optional
  addBookForm = this._fb.nonNullable.group({
    name: ["", Validators.required],
    image: ["", Validators.pattern(/^https?:\/\/\S+$/)],
    price: this._fb.control<number | null>(null, [
      Validators.required,
      Validators.min(0),
    ]),
  });

  readonly saving = signal(false);
  // Set when the cover's URL doesn't load
  readonly imageFailed = signal(false);

  coverPreview() {
    const { image } = this.addBookForm.controls;
    if (!image.value || image.invalid || this.imageFailed()) return noImage;
    return image.value;
  }

  onImageChange() {
    this.imageFailed.set(false);
  }

  onImageError() {
    this.imageFailed.set(true);
  }

  onSubmit() {
    if (this.addBookForm.invalid) {
      this.addBookForm.markAllAsTouched();
      return;
    }
    if (this.saving()) return;
    this.saving.set(true);
    const book = this.addBookForm.getRawValue();
    this._bookService
      // A valid form has a price
      .addBook({ ...book, price: Number(book.price) })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this._notify.success("books.created");
          this._router.navigate(["/books/list"]);
        },
        error: (error: Error) => {
          this._notify.errorMessage(error?.message);
          log.error(error);
        },
      });
  }
}

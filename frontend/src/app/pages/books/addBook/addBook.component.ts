import { Component, inject, signal } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButton } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIcon } from "@angular/material/icon";
import { MatInput } from "@angular/material/input";
import { Router, RouterLink } from "@angular/router";
import {
  coverProblem,
  coverTypes,
  noCoverImage,
} from "@app/pages/books/book.entity";
import { BookService } from "@app/pages/books/book.http.service";
import { Logger } from "@app/services/logger.service";
import { NotificationService } from "@app/services/notification.service";
import { FormCardComponent } from "@app/shared/components/formCard/formCard.component";
import { BusyDirective } from "@app/shared/directives/busy.directive";
import { t } from "@app/shared/i18n/translations/translationKey";
import { objectUrlOf } from "@app/shared/utils/objectUrl.utility";
import { injectSaving } from "@app/shared/utils/saving.utility";
import { TranslatePipe } from "@ngx-translate/core";
import { catchError, map, of, switchMap } from "rxjs";

const log = new Logger("AddBookComponent");

const coverProblems = {
  type: t("books.form.coverType"),
  size: t("books.form.coverTooLarge"),
};

@Component({
  selector: "app-add-book",
  templateUrl: "./addBook.component.html",
  styleUrl: "./addBook.component.scss",
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButton,
    MatFormFieldModule,
    MatIcon,
    MatInput,
    BusyDirective,
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
    price: this._fb.control<number | null>(null, [
      Validators.required,
      Validators.min(0),
    ]),
  });

  readonly saving = injectSaving(log);
  readonly coverTypes = coverTypes.join(",");
  readonly noCoverImage = noCoverImage;
  // The picked cover, sent once the book exists
  readonly cover = signal<File | null>(null);
  readonly coverPreview = objectUrlOf(this.cover);

  pickCover(event: Event) {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) return;
    const file = input.files?.[0];
    // Picking the same file again fires change again
    input.value = "";
    if (!file) return;
    const problem = coverProblem(file);
    if (problem) {
      this._notify.error(coverProblems[problem]);
      return;
    }
    this.cover.set(file);
  }

  clearCover() {
    this.cover.set(null);
  }

  onSubmit() {
    if (this.addBookForm.invalid) {
      this.addBookForm.markAllAsTouched();
      return;
    }
    const book = this.addBookForm.getRawValue();
    const cover = this.cover();
    this.saving.run(
      // A valid form has a price
      this._bookService.addBook({ ...book, price: Number(book.price) }).pipe(
        // The book stands without its cover when the upload fails; the list
        // can upload it again
        switchMap(({ id }) =>
          cover
            ? this._bookService.changeCover(id, cover).pipe(
                map(() => true),
                catchError((error: unknown) => {
                  log.error(error);
                  this._notify.error("books.form.coverNotSaved");
                  return of(false);
                })
              )
            : of(true)
        )
      ),
      (withCover) => {
        if (withCover) this._notify.success("books.created");
        this._router.navigate(["/books/list"]);
      }
    );
  }
}

import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { BooksRoutingModule } from "./books-routing.module";
import { ListBooksComponent } from "./listBooks/listBooks.component";
import { AddBooksComponent } from "./addBook/addBook.component";
import { ReactiveFormsModule } from "@angular/forms";
import { TranslateModule } from "@ngx-translate/core";

@NgModule({
  imports: [
    CommonModule,
    BooksRoutingModule,
    ReactiveFormsModule,
    TranslateModule,
    AddBooksComponent,
    ListBooksComponent,
  ],
})
export class BooksModule {}

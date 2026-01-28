import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { ListBooksComponent } from "@app/pages/books/listBooks/listBooks.component";
import { AddBooksComponent } from "./addBook/addBook.component";

const routes: Routes = [
  {
    path: "",
    redirectTo: "list",
    pathMatch: "full",
  },
  {
    path: "list",
    component: ListBooksComponent,
    data: { title: "Books List" },
  },
  {
    path: "add",
    component: AddBooksComponent,
    data: { title: "Add Book" },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BooksRoutingModule {}

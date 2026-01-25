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
  },
  {
    path: "add",
    component: AddBooksComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BooksRoutingModule {}

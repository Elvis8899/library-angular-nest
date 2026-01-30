import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { ListBooksComponent } from "@app/pages/books/listBooks/listBooks.component";

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
    loadComponent: () =>
      import("./addBook/addBook.component").then((m) => m.AddBooksComponent),
    data: { title: "Add Book" },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BooksRoutingModule {}

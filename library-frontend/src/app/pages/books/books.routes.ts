import { Routes } from "@angular/router";
import { ListBooksComponent } from "@app/pages/books/listBooks/listBooks.component";

export const routes: Routes = [
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

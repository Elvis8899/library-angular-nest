import { Routes } from "@angular/router";
import { ROLE } from "@app/models/credentials.entity";
import { ListBooksComponent } from "@app/pages/books/listBooks/listBooks.component";
import { t } from "@app/shared/i18n/translations/translationKey";

export const routes: Routes = [
  {
    path: "",
    redirectTo: "list",
    pathMatch: "full",
  },
  {
    path: "list",
    component: ListBooksComponent,
    data: { title: t("books.list.title") },
  },
  {
    path: "add",
    loadComponent: () =>
      import("./addBook/addBook.component").then((m) => m.AddBooksComponent),
    data: { title: t("books.create"), roles: [ROLE.ADMIN] },
  },
];

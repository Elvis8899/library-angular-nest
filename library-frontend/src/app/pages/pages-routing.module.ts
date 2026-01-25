import { NgModule } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { RouterModule, Routes } from "@angular/router";
import { Shell } from "@app/shell/services/shell.service";

const routes: Routes = [
  Shell.childRoutes([
    {
      path: "users",
      loadChildren: () =>
        import("./users/users.module").then((m) => m.UsersModule),
    },
    {
      path: "books",
      loadChildren: () =>
        import("./books/books.module").then((m) => m.BooksModule),
    },
    {
      path: "rentals",
      loadChildren: () =>
        import("./rentals/rentals.module").then((m) => m.RentalsModule),
    },
    // Fallback when no prior route is matched
    { path: "**", redirectTo: "", pathMatch: "full" },
  ]),
];

@NgModule({
  imports: [RouterModule.forChild(routes), ReactiveFormsModule],
  exports: [RouterModule],
})
export class PagesRoutingModule {}

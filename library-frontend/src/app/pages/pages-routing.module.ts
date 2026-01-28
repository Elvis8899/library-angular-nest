import { NgModule } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { RouterModule, Routes } from "@angular/router";
import { AlreadyLoggedCheckGuard, LoginComponent } from "@app/auth";
import { Shell } from "@app/shell/services/shell.service";

const routes: Routes = [
  { path: "", redirectTo: "/login", pathMatch: "full" },
  {
    path: "login",
    canActivate: [AlreadyLoggedCheckGuard],
    component: LoginComponent,
    data: { title: "Login" },
  },
  {
    path: "logout",
    loadComponent: () =>
      import("./auth/logout/logout.component").then((m) => m.LogoutComponent),
    data: { title: "Logout" },
  },

  Shell.childRoutes([
    {
      path: "users",
      loadChildren: () =>
        import("./users/users-routing.module").then(
          (m) => m.UsersRoutingModule
        ),
    },
    {
      path: "books",
      loadChildren: () =>
        import("./books/books-routing.module").then(
          (m) => m.BooksRoutingModule
        ),
    },
    {
      path: "rentals",
      loadChildren: () =>
        import("./rentals/rentals-routing.module").then(
          (m) => m.RentalsRoutingModule
        ),
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

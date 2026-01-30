import { Routes } from "@angular/router";
import { LoginComponent } from "@app/pages/auth/login/login.component";
import {
  AlreadyLoggedCheckGuard,
  AuthenticationGuard,
} from "@app/shared/guard/authentication.guard";

export const routes: Routes = [
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
      import("./pages/auth/logout/logout.component").then(
        (m) => m.LogoutComponent
      ),
    data: { title: "Logout" },
  },

  {
    path: "",
    loadComponent() {
      return import("./layouts/layout.component").then(
        (m) => m.LayoutComponent
      );
    },
    children: [
      {
        path: "users",
        loadChildren: () =>
          import("./pages/users/users-routing.module").then(
            (m) => m.UsersRoutingModule
          ),
      },
      {
        path: "books",
        loadChildren: () =>
          import("./pages/books/books-routing.module").then(
            (m) => m.BooksRoutingModule
          ),
      },
      {
        path: "rentals",
        loadChildren: () =>
          import("./pages/rentals/rentals-routing.module").then(
            (m) => m.RentalsRoutingModule
          ),
      },
      // Fallback when no prior route is matched
      { path: "**", redirectTo: "", pathMatch: "full" },
    ],
    canActivate: [AuthenticationGuard],
    data: { reuse: true },
  },
];

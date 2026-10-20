import { Routes } from "@angular/router";
import { ROLE } from "@app/models/credentials.entity";
import { LoginComponent } from "@app/pages/auth/login/login.component";
import {
  alreadyLoggedCheckGuard,
  authenticationGuard,
} from "@app/shared/guard/authentication.guard";
import { permissionGuard } from "@app/shared/guard/permission.guard";
import { t } from "@app/shared/i18n/translations/translationKey";

export const routes: Routes = [
  { path: "", redirectTo: "/login", pathMatch: "full" },
  {
    path: "login",
    canActivate: [alreadyLoggedCheckGuard],
    component: LoginComponent,
    data: { title: t("auth.login.title") },
  },
  {
    path: "logout",
    loadComponent: () =>
      import("./auth/logout/logout.component").then((m) => m.LogoutComponent),
    data: { title: t("nav.logout") },
  },

  {
    path: "",
    loadComponent() {
      return import("../layouts/layout.component").then(
        (m) => m.LayoutComponent
      );
    },
    children: [
      {
        path: "users",
        loadChildren: () =>
          import("./users/users.routes").then((m) => m.routes),
        data: { roles: [ROLE.ADMIN] },
      },
      {
        path: "books",
        loadChildren: () =>
          import("./books/books.routes").then((m) => m.routes),
      },
      {
        path: "rentals",
        loadChildren: () =>
          import("./rentals/rentals.routes").then((m) => m.routes),
      },
      // Fallback when no prior route is matched
      { path: "**", redirectTo: "books", pathMatch: "full" },
    ],
    canActivate: [authenticationGuard, permissionGuard],
    // canActivate runs only for this route; this checks each child's roles
    canActivateChild: [permissionGuard],
    data: { reuse: true, roles: [ROLE.ADMIN, ROLE.CLIENT] },
  },
];

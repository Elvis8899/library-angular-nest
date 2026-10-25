import { inject } from "@angular/core";
import { Routes } from "@angular/router";
import { defaultRolePage } from "@app/layouts/components/sidebar/navMenuItems";
import { ROLE } from "@app/models/credentials.entity";
import { LoginComponent } from "@app/pages/auth/login/login.component";
import { CredentialsService } from "@app/services/credentials.service";
import {
  alreadyLoggedCheckGuard,
  authenticationGuard,
} from "@app/shared/guards/authentication.guard";
import { permissionGuard } from "@app/shared/guards/permission.guard";
import { I18nService } from "@app/shared/i18n/i18n.service";
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
    // The pages' texts, which aren't in the bundle (I18nService)
    resolve: { texts: () => inject(I18nService).loadPages() },
    children: [
      // Where a role with no pages lands (defaultRolePage)
      {
        path: "home",
        loadComponent: () =>
          import("./home/home.component").then((m) => m.HomeComponent),
        data: { title: t("app.home") },
      },
      {
        path: "users",
        loadChildren: () =>
          import("./users/users.routes").then((m) => m.routes),
        data: { roles: [ROLE.ADMIN] },
      },
      {
        path: "audit",
        loadChildren: () =>
          import("./audit/audit.routes").then((m) => m.routes),
        data: { roles: [ROLE.ADMIN] },
      },
      // Lending example
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
      // Unknown pages, and pages the role can't open, go to its default page
      {
        path: "**",
        redirectTo: () => defaultRolePage(inject(CredentialsService).getRole()),
      },
    ],
    canActivate: [authenticationGuard, permissionGuard],
    // canActivate runs only for this route; this checks each child's roles
    canActivateChild: [permissionGuard],
    data: { reuse: true, roles: [ROLE.ADMIN, ROLE.CLIENT] },
  },
];

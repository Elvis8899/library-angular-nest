import { Routes } from "@angular/router";
import { ListUsersComponent } from "@app/pages/users/listUsers/listUsers.component";
import { unsavedChangesGuard } from "@app/shared/guards/unsavedChanges.guard";

export const routes: Routes = [
  {
    path: "",
    redirectTo: "list",
    pathMatch: "full",
  },
  {
    path: "list",
    component: ListUsersComponent,
  },
  {
    path: "add",
    canDeactivate: [unsavedChangesGuard],
    loadComponent: () =>
      import("./addUser/addUser.component").then((m) => m.AddUsersComponent),
  },
];

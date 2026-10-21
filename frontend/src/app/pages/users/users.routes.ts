import { Routes } from "@angular/router";
import { ListUsersComponent } from "@app/pages/users/listUsers/listUsers.component";

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
    loadComponent: () =>
      import("./addUser/addUser.component").then((m) => m.AddUsersComponent),
  },
];

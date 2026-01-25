import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { ListUsersComponent } from "@app/pages/users/listUsers/listUsers.component";
import { AddUsersComponent } from "./addUser/addUser.component";

const routes: Routes = [
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
    component: AddUsersComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class UsersRoutingModule {}

import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { AddUsersComponent } from "@app/pages/users/addUser/addUser.component";
import { ListUsersComponent } from "@app/pages/users/listUsers/listUsers.component";

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

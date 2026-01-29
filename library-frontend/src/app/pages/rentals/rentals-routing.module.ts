import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { ListRentalsComponent } from "@pages/rentals/listRentals/listRentals.component";

const routes: Routes = [
  {
    path: "",
    redirectTo: "list",
    pathMatch: "full",
  },
  {
    path: "list",
    component: ListRentalsComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RentalsRoutingModule {}

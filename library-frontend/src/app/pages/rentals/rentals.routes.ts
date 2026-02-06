import { Routes } from "@angular/router";
import { ListRentalsComponent } from "@pages/rentals/listRentals/listRentals.component";

export const routes: Routes = [
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

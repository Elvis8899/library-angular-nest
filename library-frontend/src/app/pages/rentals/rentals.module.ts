import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { BooksRoutingModule } from "./rentals-routing.module";
import { ReactiveFormsModule } from "@angular/forms";
import { TranslateModule } from "@ngx-translate/core";
import { ListRentalsComponent } from "./listRentals/listRentals.component";

@NgModule({
  imports: [
    CommonModule,
    BooksRoutingModule,
    ReactiveFormsModule,
    TranslateModule,
    ListRentalsComponent,
  ],
})
export class RentalsModule {}

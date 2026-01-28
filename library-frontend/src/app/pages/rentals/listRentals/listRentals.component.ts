import { Component, inject, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { BookRentalEntity } from "@app/@core/entities/bookRental.entity";
import { Logger } from "@app/@core/services";
import { DateTimeUtility } from "@app/@core/utils";
import { RentalService } from "@app/auth/services/rental.service";
import { HotToastService } from "@ngxpert/hot-toast";

const log = new Logger("ListRentalsComponent");

@Component({
  selector: "app-list",
  templateUrl: "./listRentals.component.html",
  styleUrl: "./listRentals.component.scss",
})
export class ListRentalsComponent implements OnInit {
  getDateOnly = DateTimeUtility.getDateOnly;
  rentals: BookRentalEntity[] = [];
  isLoading = true;

  private readonly _rentalService = inject(RentalService);
  private readonly _router = inject(Router);

  private readonly _toast = inject(HotToastService);

  ngOnInit() {
    this.refresh();
  }

  refresh() {
    this.isLoading = true;
    this._rentalService.getPaginatedBookRentals().subscribe({
      next: (res) => {
        this.rentals = res.data;
        this.isLoading = false;
      },
      error: (error) => {
        log.error(error);
        this.isLoading = false;
      },
    });
  }

  bookFinesText(rental: BookRentalEntity) {
    if (!rental.fines.overdue) return "";
    return `R$ ${rental.fines.total.toFixed(2)} (${rental.fines.fixed} + ${rental.fines.perDayValue} por dia)`;
  }

  goToAddBook() {
    this._router.navigate(["/books/add"]);
  }

  bookClicked() {
    this._toast.show("Book clicked");
  }

  returnBook(rental: BookRentalEntity) {
    this._rentalService.returnBook(rental.id).subscribe({
      next: () => {
        this._toast.success("Book returned successfully");
        this.refresh();
      },
      error: (error: Error) => {
        this._toast.error(error?.message);
        log.error(error);
      },
    });
  }
}

import { AsyncPipe } from "@angular/common";
import { Component, inject, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { BookRentalEntity } from "@app/models/bookRental.entity";
import { Logger } from "@app/services/logger.service";
import { RentalService } from "@app/services/rental.http.service";
import { DateTimeUtility } from "@app/shared/utils/date-time.utility";
import { HotToastService } from "@ngxpert/hot-toast";
import { Subject } from "rxjs";

const log = new Logger("ListRentalsComponent");

@Component({
  selector: "app-list",
  templateUrl: "./listRentals.component.html",
  styleUrl: "./listRentals.component.scss",
  imports: [AsyncPipe],
})
export class ListRentalsComponent implements OnInit {
  getDateOnly = DateTimeUtility.getDateOnly;
  rentals: BookRentalEntity[] = [];

  isLoading = new Subject<boolean>();
  loading$ = this.isLoading.asObservable();

  private readonly _rentalService = inject(RentalService);
  private readonly _router = inject(Router);

  private readonly _toast = inject(HotToastService);

  ngOnInit() {
    this.refresh();
  }

  refresh() {
    this.isLoading.next(true);
    this._rentalService.getPaginatedBookRentals().subscribe({
      next: (res) => {
        this.rentals = res.data;
        this.isLoading.next(false);
      },
      error: (error) => {
        log.error(error);
        this.isLoading.next(false);
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

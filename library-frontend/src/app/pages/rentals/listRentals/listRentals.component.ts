import { Component, inject, OnInit } from "@angular/core";
import { MatTableModule } from "@angular/material/table";
import { Router } from "@angular/router";
import { BookRentalEntity } from "@app/models/bookRental.entity";
import { PaginatedDataSource } from "@app/models/utils/paginatedDataSource.entity";
import { Logger } from "@app/services/logger.service";
import { RentalService } from "@app/services/rental.http.service";
import { CustomizedTableComponent } from "@app/shared/components/customized-table/customized-table.component";
import { DateTimeUtility } from "@app/shared/utils/date-time.utility";
import { TranslateDirective } from "@ngx-translate/core";
import { HotToastService } from "@ngxpert/hot-toast";

const log = new Logger("ListRentalsComponent");

@Component({
  selector: "app-list",
  templateUrl: "./listRentals.component.html",
  styleUrl: "./listRentals.component.scss",
  imports: [TranslateDirective, CustomizedTableComponent, MatTableModule],
})
export class ListRentalsComponent implements OnInit {
  data!: PaginatedDataSource<BookRentalEntity, object>;
  getDateOnly = DateTimeUtility.getDateOnly;

  private readonly _rentalService = inject(RentalService);
  private readonly _router = inject(Router);
  private readonly _toast = inject(HotToastService);

  ngOnInit() {
    this.data = new PaginatedDataSource<BookRentalEntity, object>(
      (r) => this._rentalService.getPaginatedBookRentals(r),
      {
        log: log,
        query: { name: "" },
        sort: {
          property: "createdAt",
          order: "desc",
        },
        displayedColumns: [
          "name",
          "email",
          "overdueDate",
          "charges",
          "actions",
        ],
      }
    );
  }

  refresh() {
    this.data.refresh();
  }

  bookFinesText(rental: BookRentalEntity) {
    if (!rental.fines.overdue) return "";
    return `R$ ${rental.fines.total.toFixed(2)} (${rental.fines.fixed} + ${rental.fines.perDayValue} por dia)`;
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

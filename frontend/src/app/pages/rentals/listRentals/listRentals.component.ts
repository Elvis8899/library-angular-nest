import { DatePipe, NgTemplateOutlet } from "@angular/common";
import { Component, computed, inject, OnInit } from "@angular/core";
import { MatIconButton } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import { MatTableModule } from "@angular/material/table";
import { MatTooltip } from "@angular/material/tooltip";
import { BookRentalEntity } from "@app/pages/rentals/bookRental.entity";
import { RentalService } from "@app/pages/rentals/rental.http.service";
import { CredentialsService } from "@app/services/credentials.service";
import { Logger } from "@app/services/logger.service";
import { NotificationService } from "@app/services/notification.service";
import { ConfirmDialog } from "@app/shared/components/confirmDialog/confirm.dialog.component";
import { CustomizedTableComponent } from "@app/shared/components/customizedTable/customizedTable.component";
import { PaginatedDataSource } from "@app/shared/components/customizedTable/paginatedDataSource";
import { PageHeaderComponent } from "@app/shared/components/pageHeader/pageHeader.component";
import { CellDefDirective } from "@app/shared/directives/cellDef.directive";
import {
  templateContext,
  TemplateContextDirective,
} from "@app/shared/directives/templateContext.directive";
import { injectCurrentLocale } from "@app/shared/i18n/currentLocale";
import { MoneyPipe } from "@app/shared/pipes/number.pipes";
import { moneyFormat } from "@app/shared/utils/numberFormat.utility";
import { injectIsSmallScreen } from "@app/shared/utils/smallScreen.utility";
import { TranslatePipe } from "@ngx-translate/core";
import { filter } from "rxjs";

const log = new Logger("ListRentalsComponent");

/** The active rentals: everyone's for admins, their own for clients. */
@Component({
  selector: "app-list-rentals",
  templateUrl: "./listRentals.component.html",
  styleUrl: "./listRentals.component.scss",
  imports: [
    CellDefDirective,
    TemplateContextDirective,
    MoneyPipe,
    DatePipe,
    NgTemplateOutlet,
    MatIconButton,
    MatIcon,
    MatTableModule,
    MatTooltip,
    CustomizedTableComponent,
    PageHeaderComponent,
    TranslatePipe,
  ],
})
export class ListRentalsComponent implements OnInit {
  data!: PaginatedDataSource<BookRentalEntity, object>;
  // Types the row templates' let-rental
  readonly rowContext = templateContext<{ $implicit: BookRentalEntity }>();

  readonly locale = injectCurrentLocale();
  readonly isSmallScreen = injectIsSmallScreen();
  // Small screens leave out when the book was rented, and show the fine
  // under the due date
  readonly columns = computed(() =>
    this.isSmallScreen()
      ? ["book", "dueDate", "actions"]
      : ["book", "rentedOn", "dueDate", "fine", "actions"]
  );
  // Clients only see their own rentals, so only admins see who rented
  readonly showClient = inject(CredentialsService).isAdmin();

  private readonly _rentalService = inject(RentalService);
  private readonly _confirmDialog = inject(ConfirmDialog);
  private readonly _notify = inject(NotificationService);

  ngOnInit() {
    this.data = new PaginatedDataSource<BookRentalEntity, object>(
      (r) => this._rentalService.getPaginatedBookRentals(r),
      {
        log: log,
        query: {},
        sort: {
          property: "createdAt",
          order: "desc",
        },
        displayedColumns: ["book", "rentedOn", "dueDate", "fine", "actions"],
      }
    );
  }

  refresh() {
    this.data.refresh();
  }

  fineDetailsParams(rental: BookRentalEntity) {
    const money = moneyFormat(this.locale());
    return {
      fixed: money(rental.fines.fixed),
      perDay: money(rental.fines.perDayValue),
      days: rental.fines.days,
    };
  }

  returnBook(rental: BookRentalEntity) {
    this._confirmDialog
      .confirm({
        title: "rentals.return.title",
        message: "rentals.return.confirm",
        messageParams: { book: rental.bookName },
        confirmLabel: "rentals.return.action",
      })
      .pipe(filter(Boolean))
      .subscribe(() =>
        this._rentalService.returnBook(rental.id).subscribe({
          next: () => {
            this._notify.success("rentals.return.done");
            this.refresh();
          },
          error: (error: Error) => {
            this._notify.errorMessage(error?.message);
            log.error(error);
          },
        })
      );
  }
}

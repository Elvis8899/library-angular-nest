import {
  CurrencyPipe,
  DatePipe,
  formatCurrency,
  NgTemplateOutlet,
} from "@angular/common";
import { Component, computed, inject, LOCALE_ID, OnInit } from "@angular/core";
import { MatIconButton } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import { MatTableModule } from "@angular/material/table";
import { MatTooltip } from "@angular/material/tooltip";
import { BookRentalEntity } from "@app/models/bookRental.entity";
import { PaginatedDataSource } from "@app/models/utils/paginatedDataSource.entity";
import { CredentialsService } from "@app/services/credentials.service";
import { Logger } from "@app/services/logger.service";
import { RentalService } from "@app/services/rental.http.service";
import { ConfirmDialog } from "@app/shared/components/confirmDialog/confirm.dialog.component";
import { CustomizedTableComponent } from "@app/shared/components/customizedTable/customizedTable.component";
import { PageHeaderComponent } from "@app/shared/components/pageHeader/pageHeader.component";
import { injectIsSmallScreen } from "@app/shared/helpers/smallScreen";
import { injectCurrentLocale } from "@app/shared/i18n/currentLocale";
import { TranslatePipe, TranslateService } from "@ngx-translate/core";
import { HotToastService } from "@ngxpert/hot-toast";
import { filter } from "rxjs";

const log = new Logger("ListRentalsComponent");

/** The active rentals: everyone's for admins, their own for clients. */
@Component({
  selector: "app-list-rentals",
  templateUrl: "./listRentals.component.html",
  styleUrl: "./listRentals.component.scss",
  imports: [
    CurrencyPipe,
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
  // Keys with placeholders read safer here than inside {{ }}
  readonly fineDetailsKey =
    "{{fixed}} + {{perDay}} per day × {{days}} days late";

  private readonly _defaultLocale = inject(LOCALE_ID);
  private readonly _rentalService = inject(RentalService);
  private readonly _confirmDialog = inject(ConfirmDialog);
  private readonly _toast = inject(HotToastService);
  private readonly _translate = inject(TranslateService);

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
    const locale = this.locale() ?? this._defaultLocale;
    const money = (value: number) => formatCurrency(value, locale, "R$", "BRL");
    return {
      fixed: money(rental.fines.fixed),
      perDay: money(rental.fines.perDayValue),
      days: rental.fines.days,
    };
  }

  returnBook(rental: BookRentalEntity) {
    this._confirmDialog
      .confirm({
        title: "Return book",
        message: "Return {{book}}?",
        messageParams: { book: rental.bookName },
        confirmLabel: "Return",
      })
      .pipe(filter(Boolean))
      .subscribe(() =>
        this._rentalService.returnBook(rental.id).subscribe({
          next: () => {
            this._toast.success(
              this._translate.instant("Book returned successfully")
            );
            this.refresh();
          },
          error: (error: Error) => {
            this._toast.error(error?.message);
            log.error(error);
          },
        })
      );
  }
}

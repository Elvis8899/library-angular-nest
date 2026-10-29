import { DatePipe } from "@angular/common";
import { Component, computed, inject } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { FormBuilder, ReactiveFormsModule } from "@angular/forms";
import { MatButton } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInput } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatTableModule } from "@angular/material/table";
import {
  AuditEntryEntity,
  AuditQuery,
  inputText,
  noAuditFilters,
} from "@app/pages/audit/audit.entity";
import { AuditService } from "@app/pages/audit/audit.http.service";
import { Logger } from "@app/services/logger.service";
import { UserService } from "@app/services/user.http.service";
import { CustomizedTableComponent } from "@app/shared/components/customizedTable/customizedTable.component";
import { PaginatedDataSource } from "@app/shared/components/customizedTable/paginatedDataSource";
import { PageHeaderComponent } from "@app/shared/components/pageHeader/pageHeader.component";
import { CellDefDirective } from "@app/shared/directives/cellDef.directive";
import { injectCurrentLocale } from "@app/shared/i18n/currentLocale";
import { injectIsSmallScreen } from "@app/shared/utils/smallScreen.utility";
import { TranslatePipe } from "@ngx-translate/core";
import { catchError, map, of } from "rxjs";

const log = new Logger("AuditLogComponent");

// The whole list of accounts, for the person filter
const ALL_USERS = 1000;

/**
 * Auditoria (Admin): who changed what, newest first, one row per write that
 * succeeded, searched by person, operation, record and days. A
 * row opens what the operation received.
 */
@Component({
  selector: "app-audit-log",
  templateUrl: "./auditLog.component.html",
  styleUrl: "./auditLog.component.scss",
  imports: [
    DatePipe,
    MatButton,
    MatFormFieldModule,
    MatInput,
    MatSelectModule,
    MatTableModule,
    CellDefDirective,
    CustomizedTableComponent,
    PageHeaderComponent,
    ReactiveFormsModule,
    TranslatePipe,
  ],
})
export class AuditLogComponent {
  private readonly _audit = inject(AuditService);
  private readonly _fb = inject(FormBuilder);

  readonly locale = injectCurrentLocale();
  readonly isSmallScreen = injectIsSmallScreen();
  // Small screens leave out the record
  readonly columns = computed(() =>
    this.isSmallScreen()
      ? ["recordedAt", "user", "useCase", "input"]
      : ["recordedAt", "user", "useCase", "recordId", "input"],
  );
  readonly inputText = inputText;

  readonly users = toSignal(
    inject(UserService)
      .getPaginatedUsers({ page: 0, limit: ALL_USERS })
      .pipe(
        map(({ data }) => data),
        catchError((error: unknown) => {
          log.error(error);
          return of([]);
        }),
      ),
    { initialValue: [] },
  );

  readonly filters = this._fb.nonNullable.group<AuditQuery>({
    ...noAuditFilters,
  });

  readonly data = new PaginatedDataSource<AuditEntryEntity, AuditQuery>(
    (request) => this._audit.getEntries(request),
    {
      log,
      query: noAuditFilters,
      sort: { property: "recordedAt", order: "desc" },
      displayedColumns: this.columns(),
      pageSize: 25,
    },
  );

  /** Whether the period ends before it starts. */
  periodInverted(): boolean {
    const { from, to } = this.filters.getRawValue();
    return !!from && !!to && from > to;
  }

  search() {
    if (this.periodInverted()) return;
    this.data.queryBy(this.filters.getRawValue());
  }

  clear() {
    this.filters.reset();
    this.data.queryBy(noAuditFilters);
  }
}

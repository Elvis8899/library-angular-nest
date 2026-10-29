import { formatDate, NgTemplateOutlet } from "@angular/common";
import {
  booleanAttribute,
  Component,
  computed,
  contentChildren,
  Directive,
  inject,
  input,
  TemplateRef,
} from "@angular/core";
import { injectCurrentLocale } from "@app/shared/i18n/currentLocale";
import { TranslationKey } from "@app/shared/i18n/translations/translationKey";
import { moneyFormat, qtyFormat } from "@app/shared/utils/numberFormat.utility";
import { injectIsSmallScreen } from "@app/shared/utils/smallScreen.utility";
import { TranslatePipe } from "@ngx-translate/core";

/** How a column writes its numbers and dates, in the screen's language:
 * dates as 21/10/2026 (`date`, `dateTime` with the time) or as the
 * language writes them (`shortDate`, `short` with the time). */
export type ReportFormat =
  "money" | "qty" | "date" | "dateTime" | "shortDate" | "short";

type CellValue = string | number | null;

/** A translated cell: its key, with the values it takes. */
export type ReportTranslation =
  TranslationKey | { key: TranslationKey; params: Record<string, unknown> };

/** One column of a report table. */
export interface ReportColumn<Row> {
  // Names the column, for its total and its custom cell
  key: string;
  // No column with a header leaves the table without one
  header?: TranslationKey;
  // The cell's text: a number or a yyyy-MM-dd date in the column's format,
  // or text as it is; none shows "—"
  value?: (row: Row) => CellValue | undefined;
  // Or translated (a status's name, "OC 12"); null shows "—"
  translated?: (row: Row) => ReportTranslation | null;
  format?: ReportFormat;
  // To the end, as numbers go: money and qty always do
  end?: boolean;
  cellClass?: (row: Row) => Record<string, boolean>;
  // Left out on small screens
  wideOnly?: boolean;
}

/** The totals row: its label in the first column, unless that column has a
 * total, and each column's total by its key, in its format. */
export interface ReportTotals {
  label: TranslationKey;
  values: Partial<Record<string, CellValue>>;
}

const endFormats: readonly (ReportFormat | undefined)[] = ["money", "qty"];

/** Totals that sum each money and qty column over the rows. */
export const summedTotals = <Row>(
  label: TranslationKey,
  columns: readonly ReportColumn<Row>[],
  rows: readonly Row[],
): ReportTotals => ({
  label,
  values: Object.fromEntries(
    columns
      .filter((column) => endFormats.includes(column.format))
      .map((column) => [
        column.key,
        rows.reduce((sum, row) => sum + Number(column.value?.(row) ?? 0), 0),
      ]),
  ),
});

/**
 * A column's own cell, for what text can't say (chips, links, two lines).
 * The rows only type the template's row:
 *
 *   <ng-template appReportCell="status" [appReportCellRows]="lines" let-line>
 */
@Directive({ selector: "ng-template[appReportCell]" })
export class ReportCellDirective<Row> {
  readonly appReportCell = input.required<string>();
  readonly appReportCellRows = input.required<readonly Row[]>();

  readonly template = inject<TemplateRef<{ $implicit: Row }>>(TemplateRef);

  // Only the template type checker calls it, with this signature
  /* v8 ignore start */
  /* eslint-disable @typescript-eslint/no-unused-vars */
  static ngTemplateContextGuard<Row>(
    _directive: ReportCellDirective<Row>,
    context: unknown,
  ): context is { $implicit: Row } {
    return true;
  }
  /* eslint-enable @typescript-eslint/no-unused-vars */
  /* v8 ignore stop */
}

/**
 * A read-only table of figures (a `.data-table` in its scroll wrapper),
 * its columns defined once in TypeScript:
 *
 *   <app-report-table [columns]="columns" [rows]="rows" empty="x.none" />
 */
@Component({
  selector: "app-report-table",
  templateUrl: "./reportTable.component.html",
  host: { class: "block" },
  imports: [NgTemplateOutlet, TranslatePipe],
})
export class ReportTableComponent<Row> {
  readonly columns = input.required<readonly ReportColumn<Row>[]>();
  readonly rows = input.required<readonly Row[]>();
  readonly totals = input<ReportTotals | null>(null);
  // Shown instead of an empty table
  readonly empty = input<TranslationKey | null>(null);
  readonly compact = input(false, { transform: booleanAttribute });

  // The compiler wraps the query's argument in a function that only runs
  // outside tests, so coverage would count it as missed
  /* v8 ignore start */
  private readonly _cellTemplates = contentChildren(ReportCellDirective);
  /* v8 ignore stop */
  private readonly _isSmallScreen = injectIsSmallScreen();
  private readonly _locale = injectCurrentLocale();

  readonly shown = computed(() => {
    const small = this._isSmallScreen();
    return this.columns().filter((column) => !(small && column.wideOnly));
  });
  readonly withHeader = computed(() =>
    this.shown().some((column) => column.header),
  );
  readonly cells = computed(
    () =>
      new Map(
        this._cellTemplates().map((cell) => [
          cell.appReportCell(),
          cell.template,
        ]),
      ),
  );
  private readonly _formats = computed(() => {
    const locale = this._locale();
    const dateLocale = locale ?? "en-US";
    const date = (pattern: string) => (value: CellValue) =>
      formatDate(String(value), pattern, dateLocale);
    const number =
      (format: (value: number) => string) =>
      (value: CellValue): string =>
        typeof value === "number" ? format(value) : String(value);
    return {
      money: number(moneyFormat(locale)),
      qty: number(qtyFormat(locale)),
      date: date("dd/MM/yyyy"),
      dateTime: date("dd/MM/yyyy HH:mm"),
      shortDate: date("shortDate"),
      short: date("short"),
    } satisfies Record<ReportFormat, (value: CellValue) => string>;
  });

  translation(
    column: ReportColumn<Row>,
    row: Row,
  ): { key: TranslationKey; params?: Record<string, unknown> } | null {
    const translation = column.translated?.(row) ?? null;
    return typeof translation === "string" ? { key: translation } : translation;
  }

  isEnd(column: ReportColumn<Row>): boolean {
    return column.end === true || endFormats.includes(column.format);
  }

  text(column: ReportColumn<Row>, value: CellValue | undefined): string {
    if (value === null || value === undefined) return "—";
    return column.format
      ? this._formats()[column.format](value)
      : String(value);
  }

  /** The totals row's cell: the label in the first column if it has no
   * total, nothing in the others without one. */
  total(totals: ReportTotals, column: ReportColumn<Row>, first: boolean) {
    const value = totals.values[column.key];
    if (value !== undefined) return { text: this.text(column, value) };
    return first ? { label: totals.label } : { text: "" };
  }
}

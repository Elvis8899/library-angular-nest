import { BreakpointObserver, BreakpointState } from "@angular/cdk/layout";
import {
  ReportCellDirective,
  ReportColumn,
  ReportTableComponent,
  ReportTotals,
  summedTotals,
} from "@app/shared/components/reportTable/reportTable.component";
import { t } from "@app/shared/i18n/translations/translationKey";
import { usePtBR } from "@app/shared/utils/test/translations";
import { provideTranslateService, TranslateService } from "@ngx-translate/core";
import { createHostFactory, SpectatorHost } from "@openng/spectator/vitest";
import { BehaviorSubject } from "rxjs";

interface Line {
  item: string | null;
  qty: number;
  cost: number;
  late: boolean;
}

const lines: Line[] = [
  { item: "Prego", qty: 1234.5, cost: 10, late: true },
  { item: null, qty: 2, cost: 0.5, late: false },
];

describe("ReportTableComponent", () => {
  let spectator: SpectatorHost<ReportTableComponent<Line>>;
  const breakpoints = new BehaviorSubject<BreakpointState>({
    matches: false,
    breakpoints: {},
  });
  const createHost = createHostFactory({
    component: ReportTableComponent<Line>,
    imports: [ReportCellDirective],
    providers: [
      provideTranslateService(),
      {
        provide: BreakpointObserver,
        useFactory: () => ({ observe: () => breakpoints }),
      },
    ],
  });
  const host = (
    columns: ReportColumn<Line>[],
    options: {
      rows?: Line[];
      totals?: ReportTotals | null;
      content?: string;
      attributes?: string;
      language?: boolean;
    } = {}
  ) => {
    spectator = createHost(
      `<app-report-table [columns]="columns" [rows]="rows" [totals]="totals" ${options.attributes ?? ""}>${options.content ?? ""}</app-report-table>`,
      {
        hostProps: {
          columns,
          rows: options.rows ?? lines,
          totals: options.totals ?? null,
        },
        detectChanges: false,
      }
    );
    if (options.language !== false) usePtBR(spectator.inject(TranslateService));
    spectator.detectChanges();
  };
  const cells = (row: number) =>
    spectator
      .queryAll(`tbody tr:nth-child(${row}) td`)
      .map((cell) => cell.textContent.trim());
  const item: ReportColumn<Line> = {
    key: "item",
    header: t("common.name"),
    value: (line) => line.item,
  };

  beforeEach(() => {
    breakpoints.next({ matches: false, breakpoints: {} });
  });

  it("Should write each column's header and cells, a dash for no value", () => {
    // Act
    host([item, { key: "qty", value: (line) => line.qty, end: true }]);
    // Assert
    expect(
      spectator.queryAll("thead th").map((th) => th.textContent.trim())
    ).toEqual(["Nome", ""]);
    expect(spectator.query("thead th:last-child")).toHaveClass("num");
    expect(cells(1)).toEqual(["Prego", "1234.5"]);
    expect(cells(2)).toEqual(["—", "2"]);
    expect(spectator.query("tbody td:first-child")).not.toHaveClass("num");
    expect(spectator.query("tbody td:last-child")).toHaveClass("num");
    expect(spectator.query(".table-scroll table.data-table")).toBeTruthy();
    expect(spectator.query("table")).not.toHaveClass("compact");
  });

  it("Should write numbers and dates in the column's format, numbers at the end", () => {
    // Arrange
    const row = (value: number | string) =>
      ({ key: "x", value: () => value }) satisfies ReportColumn<Line>;
    // Act
    host(
      [
        { ...row(1234.5), key: "money", format: "money" },
        { ...row(1234.5), key: "qty", format: "qty" },
        { ...row("2026-10-21"), key: "date", format: "date" },
        { ...row("2026-10-21T13:05:00"), key: "dateTime", format: "dateTime" },
        { ...row("2026-10-21"), key: "shortDate", format: "shortDate" },
        { ...row("2026-10-21T13:05:00"), key: "short", format: "short" },
        { ...row("—1"), key: "text", format: "money" },
      ],
      { rows: [lines[0]] }
    );
    // Assert
    expect(cells(1)).toEqual([
      "R$\u00a01.234,50",
      "1.234,5",
      "21/10/2026",
      "21/10/2026 13:05",
      "21/10/2026",
      "21/10/2026 13:05",
      "—1",
    ]);
    expect(
      spectator.queryAll("tbody td").map((td) => td.classList.contains("num"))
    ).toEqual([true, true, false, false, false, false, true]);
  });

  it("Should write the language's dates in English before a language is set", () => {
    // Act
    host([{ key: "day", value: () => "2026-10-21", format: "shortDate" }], {
      rows: [lines[0]],
      language: false,
    });
    // Assert
    expect(cells(1)).toEqual(["10/21/26"]);
  });

  it("Should translate a translated column's keys", () => {
    // Act
    host([
      {
        key: "state",
        translated: (line) => (line.late ? t("common.close") : null),
      },
      {
        key: "count",
        translated: () => ({
          key: t("paginator.empty"),
          params: { length: 2 },
        }),
      },
    ]);
    // Assert
    expect(cells(1)).toEqual(["Fechar", "0 de 2"]);
    expect(cells(2)).toEqual(["—", "0 de 2"]);
  });

  it("Should leave the header out when no column has one", () => {
    // Act
    host([{ key: "item", value: (line) => line.item }]);
    // Assert
    expect(spectator.query("thead")).toBeNull();
  });

  it("Should give each cell its classes", () => {
    // Act
    host([
      {
        ...item,
        cellClass: (line) => ({ "text-error": line.late }),
        end: true,
      },
    ]);
    // Assert
    const [first, second] = spectator.queryAll("tbody td");
    expect(first).toHaveClass(["text-error", "num"]);
    expect(second).not.toHaveClass("text-error");
    expect(second).toHaveClass("num");
  });

  it("Should leave the wide-only columns out on small screens", () => {
    // Arrange
    const columns: ReportColumn<Line>[] = [
      item,
      {
        key: "qty",
        header: t("common.save"),
        value: (l) => l.qty,
        wideOnly: true,
      },
    ];
    host(columns);
    expect(spectator.queryAll("thead th")).toHaveLength(2);
    // Act
    breakpoints.next({ matches: true, breakpoints: {} });
    spectator.detectChanges();
    // Assert
    expect(spectator.queryAll("thead th")).toHaveLength(1);
    expect(cells(1)).toEqual(["Prego"]);
  });

  it("Should end with the totals, the label in the first column without one", () => {
    // Act
    host(
      [
        item,
        { key: "note", value: () => "x" },
        { key: "cost", value: (line) => line.cost, format: "money" },
      ],
      { totals: { label: t("common.confirm"), values: { cost: 10.5 } } }
    );
    // Assert
    const totals = spectator.queryAll("tfoot td");
    expect(totals.map((td) => td.textContent.trim())).toEqual([
      "Confirmar",
      "",
      "R$\u00a010,50",
    ]);
    expect(totals.map((td) => td.classList.contains("num"))).toEqual([
      false,
      false,
      true,
    ]);
  });

  it("Should write the first column's total instead of the label", () => {
    // Act
    host([{ key: "qty", value: (line) => line.qty, format: "qty" }], {
      totals: { label: t("common.confirm"), values: { qty: 3 } },
    });
    // Assert
    expect(spectator.query("tfoot td")).toHaveExactTrimmedText("3");
  });

  it("Should draw a column's own cell from its template, with the row", () => {
    // Act
    host([item, { key: "qty", header: t("common.save") }], {
      content: `<ng-template appReportCell="qty" [appReportCellRows]="rows" let-line><strong>{{ line.qty }}</strong></ng-template>`,
    });
    // Assert
    expect(
      spectator.queryAll("tbody strong").map((cell) => cell.textContent)
    ).toEqual(["1234.5", "2"]);
    expect(cells(1)[0]).toBe("Prego");
  });

  it("Should say why it's empty instead of an empty table", () => {
    // Act
    host([item], { rows: [], attributes: `empty="common.noResults"` });
    // Assert
    expect(spectator.query("p.message")).toHaveExactTrimmedText(
      "Nenhum resultado"
    );
    expect(spectator.query("table")).toBeNull();
  });

  it("Should draw an empty table without an empty message, compact when asked", () => {
    // Act
    host([item], { rows: [], attributes: "compact" });
    // Assert
    expect(spectator.query("table")).toHaveClass("compact");
    expect(spectator.queryAll("tbody tr")).toHaveLength(0);
    expect(spectator.query("p.message")).toBeNull();
  });

  it("Should sum the money and qty columns for the totals", () => {
    // Act
    const totals = summedTotals(
      t("common.confirm"),
      [
        item,
        { key: "qty", value: (line) => line.qty, format: "qty" },
        { key: "cost", value: (line) => line.cost, format: "money" },
        { key: "blank", format: "money" },
      ],
      lines
    );
    // Assert
    expect(totals).toEqual({
      label: "common.confirm",
      values: { qty: 1236.5, cost: 10.5, blank: 0 },
    });
  });
});

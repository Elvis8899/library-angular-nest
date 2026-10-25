import { DataSource } from "@angular/cdk/collections";
import { Directive, input } from "@angular/core";

/**
 * Types a mat-table cell's row, which Material leaves as any, from the
 * table's data:
 *
 *   <td *matCellDef="let entry; dataSource: data" mat-cell>
 */
// Material's selector, so it adds to its cells
// eslint-disable-next-line @angular-eslint/directive-selector
@Directive({ selector: "[matCellDef][matCellDefDataSource]" })
export class CellDefDirective<Row> {
  readonly matCellDefDataSource = input.required<
    DataSource<Row> | readonly Row[]
  >();

  // Only the template type checker calls it, with this signature
  /* v8 ignore start */
  /* eslint-disable @typescript-eslint/no-unused-vars */
  static ngTemplateContextGuard<Row>(
    _directive: CellDefDirective<Row>,
    context: unknown
  ): context is { $implicit: Row } {
    return true;
  }
  /* eslint-enable @typescript-eslint/no-unused-vars */
  /* v8 ignore stop */
}

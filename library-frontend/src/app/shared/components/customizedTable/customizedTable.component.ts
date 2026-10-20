import {
  AfterContentInit,
  Component,
  computed,
  contentChildren,
  input,
  viewChild,
} from "@angular/core";
import { toObservable, toSignal } from "@angular/core/rxjs-interop";
import { MatPaginatorModule, PageEvent } from "@angular/material/paginator";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import {
  MatColumnDef,
  MatTable,
  MatTableModule,
} from "@angular/material/table";
import { PaginatedDataSource } from "@app/models/utils/paginatedDataSource.entity";
import { TranslatePipe } from "@ngx-translate/core";
import { switchMap } from "rxjs";

/**
 * A paginated Material table. The page declares its columns as content
 * (`<ng-container matColumnDef>`), and they're added to the table here.
 */
@Component({
  selector: "app-customized-table",
  templateUrl: "./customizedTable.component.html",
  styleUrl: "./customizedTable.component.scss",
  imports: [
    MatPaginatorModule,
    MatProgressBarModule,
    MatTableModule,
    TranslatePipe,
  ],
})
export class CustomizedTableComponent<T, Q> implements AfterContentInit {
  readonly data = input.required<PaginatedDataSource<T, Q>>();
  // The columns to show, when they change with the screen size; defaults to
  // the data source's displayedColumns
  readonly columns = input<string[]>();
  readonly shownColumns = computed(
    () => this.columns() ?? this.data().displayedColumns
  );

  // The data source's requests stay RxJS (switchMap cancels a stale one);
  // the template reads their state as signals
  private readonly _data$ = toObservable(this.data);
  readonly loading = toSignal(
    this._data$.pipe(switchMap((data) => data.loading$)),
    { initialValue: false }
  );
  readonly page = toSignal(this._data$.pipe(switchMap((data) => data.page$)));

  // The compiler wraps these queries' arguments in functions that only run
  // outside tests, so coverage would count them as missed
  /* v8 ignore start */
  private readonly _table = viewChild.required(MatTable<T>);
  private readonly _columnDefs = contentChildren(MatColumnDef);
  /* v8 ignore stop */

  // The page's column definitions are content, so the table can't see them
  // by itself
  ngAfterContentInit() {
    const table = this._table();
    this._columnDefs().forEach((columnDef) => table.addColumnDef(columnDef));
  }

  handlePageEvent(event: PageEvent) {
    const data = this.data();
    if (data.pageSize$.getValue() !== event.pageSize) {
      // Page Reset
      data.pageSize$.next(event.pageSize);
      return;
    }

    data.fetch(event.pageIndex);
  }
}

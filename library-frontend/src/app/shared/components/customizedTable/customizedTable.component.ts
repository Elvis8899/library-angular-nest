import { AsyncPipe } from "@angular/common";
import {
  AfterContentInit,
  Component,
  ContentChildren,
  Input,
  QueryList,
  ViewChild,
} from "@angular/core";
import { MatPaginatorModule, PageEvent } from "@angular/material/paginator";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import {
  MatColumnDef,
  MatTable,
  MatTableModule,
} from "@angular/material/table";
import { PaginatedDataSource } from "@app/models/utils/paginatedDataSource.entity";
import { TranslatePipe } from "@ngx-translate/core";

@Component({
  selector: "app-customized-table",
  templateUrl: "./customizedTable.component.html",
  styleUrl: "./customizedTable.component.scss",
  imports: [
    AsyncPipe,
    MatPaginatorModule,
    MatProgressBarModule,
    MatTableModule,
    TranslatePipe,
  ],
})
export class CustomizedTableComponent<T, Q> implements AfterContentInit {
  @Input() data!: PaginatedDataSource<T, Q>;
  // this is where the magic happens:
  @ViewChild(MatTable, { static: true }) table?: MatTable<T>;
  @ContentChildren(MatColumnDef) columnDefs!: QueryList<MatColumnDef>;

  // after the <ng-content> has been initialized, the column definitions are available.
  // All that's left is to add them to the table ourselves:
  ngAfterContentInit() {
    this.columnDefs.forEach((columnDef) => {
      this.table?.addColumnDef(columnDef);
    });
  }

  handlePageEvent(event: PageEvent) {
    if (this.data.pageSize$.getValue() !== event.pageSize) {
      // Page Reset
      this.data.pageSize$.next(event.pageSize);
      return;
    }

    this.data.fetch(event.pageIndex);
  }
}

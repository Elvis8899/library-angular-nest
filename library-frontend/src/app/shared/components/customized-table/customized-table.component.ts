import { AsyncPipe } from "@angular/common";
import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  ContentChildren,
  Input,
  QueryList,
  ViewChild,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { MatNativeDateModule } from "@angular/material/core";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatPaginatorModule, PageEvent } from "@angular/material/paginator";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSelectModule } from "@angular/material/select";
import {
  MatColumnDef,
  MatTable,
  MatTableModule,
} from "@angular/material/table";
import { PaginatedDataSource } from "@app/models/utils/paginatedDataSource.entity";
import { TranslateModule } from "@ngx-translate/core";

@Component({
  selector: "app-customized-table",
  templateUrl: "./customized-table.component.html",
  styleUrl: "./customized-table.component.scss",
  imports: [
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatButtonModule,
    TranslateModule,
    AsyncPipe,
    MatTableModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatPaginatorModule,
    MatSelectModule,
    MatButtonToggleModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
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

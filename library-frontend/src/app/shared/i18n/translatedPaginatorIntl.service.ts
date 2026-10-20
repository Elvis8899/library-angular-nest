import { DestroyRef, inject, Injectable } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { MatPaginatorIntl } from "@angular/material/paginator";
import { TranslateService } from "@ngx-translate/core";
import { startWith } from "rxjs";

/** The paginator's labels in the selected language. */
@Injectable()
export class TranslatedPaginatorIntl extends MatPaginatorIntl {
  private readonly _translate = inject(TranslateService);

  constructor() {
    super();
    this._translate.onLangChange
      .pipe(startWith(null), takeUntilDestroyed(inject(DestroyRef)))
      .subscribe(() => {
        this.itemsPerPageLabel = this._translate.instant("Items per page");
        this.nextPageLabel = this._translate.instant("Next page");
        this.previousPageLabel = this._translate.instant("Previous page");
        this.firstPageLabel = this._translate.instant("First page");
        this.lastPageLabel = this._translate.instant("Last page");
        // Re-renders the paginators already on screen
        this.changes.next();
      });
  }

  override getRangeLabel = (page: number, pageSize: number, length: number) => {
    if (length === 0 || pageSize === 0) {
      return this._translate.instant("0 of {{length}}", { length });
    }
    const start = page * pageSize + 1;
    const end = Math.min((page + 1) * pageSize, length);
    return this._translate.instant("{{start}} – {{end}} of {{length}}", {
      start,
      end,
      length,
    });
  };
}

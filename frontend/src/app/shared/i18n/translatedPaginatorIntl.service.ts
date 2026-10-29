import { DestroyRef, inject, Injectable } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { MatPaginatorIntl } from "@angular/material/paginator";
import { t } from "@app/shared/i18n/translations/translationKey";
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
        this.itemsPerPageLabel = this._translate.instant(
          t("paginator.itemsPerPage"),
        );
        this.nextPageLabel = this._translate.instant(t("paginator.nextPage"));
        this.previousPageLabel = this._translate.instant(
          t("paginator.previousPage"),
        );
        this.firstPageLabel = this._translate.instant(t("paginator.firstPage"));
        this.lastPageLabel = this._translate.instant(t("paginator.lastPage"));
        // Re-renders the paginators already on screen
        this.changes.next();
      });
  }

  override getRangeLabel = (page: number, pageSize: number, length: number) => {
    if (length === 0 || pageSize === 0) {
      return this._translate.instant(t("paginator.empty"), { length });
    }
    const start = page * pageSize + 1;
    const end = Math.min((page + 1) * pageSize, length);
    return this._translate.instant(t("paginator.range"), {
      start,
      end,
      length,
    });
  };
}

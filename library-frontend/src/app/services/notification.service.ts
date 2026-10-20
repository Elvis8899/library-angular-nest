import { inject, Injectable } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import {
  t,
  TranslationKey,
} from "@app/shared/i18n/translations/translationKey";
import { TranslateService } from "@ngx-translate/core";

const successDuration = 4000;
// Errors stay longer, and can be closed
const errorDuration = 8000;

/**
 * Short messages in a Material snackbar, at the bottom of the screen. One
 * shows at a time: a new one replaces the last.
 */
@Injectable({ providedIn: "root" })
export class NotificationService {
  private readonly _snackBar = inject(MatSnackBar);
  private readonly _translate = inject(TranslateService);

  success(key: TranslationKey) {
    this._snackBar.open(this._translate.instant(key), undefined, {
      duration: successDuration,
      politeness: "polite",
      panelClass: "notification-success",
    });
  }

  error(key: TranslationKey) {
    this.errorMessage(this._translate.instant(key));
  }

  /** An error whose text is already translated, like the API's errors. */
  errorMessage(message: string) {
    this._snackBar.open(message, this._translate.instant(t("common.close")), {
      duration: errorDuration,
      politeness: "assertive",
      panelClass: "notification-error",
    });
  }
}

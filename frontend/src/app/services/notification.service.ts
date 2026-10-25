import { DestroyRef, inject, Injectable } from "@angular/core";
import { MatSnackBar, MatSnackBarConfig } from "@angular/material/snack-bar";
import {
  t,
  TranslationKey,
} from "@app/shared/i18n/translations/translationKey";
import { TranslateService } from "@ngx-translate/core";
import { Observable, Subject } from "rxjs";

const successDuration = 4000;
// Errors stay longer, and can be closed
const errorDuration = 8000;

interface PersistentMessage {
  key: TranslationKey;
  actionKey: TranslationKey;
  action$: Subject<void>;
}

/**
 * Short messages in a Material snackbar, at the bottom of the screen. One
 * shows at a time: a new one replaces the last. A persistent message (like
 * "a new version is available") comes back once the others close.
 */
@Injectable({ providedIn: "root" })
export class NotificationService {
  private readonly _snackBar = inject(MatSnackBar);
  private readonly _translate = inject(TranslateService);
  private readonly _destroyRef = inject(DestroyRef);

  private _persistent: PersistentMessage | null = null;
  // Which snackbar is the newest, and whether it's still showing: Material
  // dismisses the previous one while opening the next
  private _lastId = 0;
  private _showing = false;

  success(key: TranslationKey, params?: Record<string, unknown>) {
    this._open(this._translate.instant(key, params), undefined, {
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
    this._open(message, this._translate.instant(t("common.close")), {
      duration: errorDuration,
      politeness: "assertive",
      panelClass: "notification-error",
    });
  }

  /**
   * A message that stays until its action is picked. Other messages show over
   * it, and it comes back once they close; one already showing isn't cut
   * short. Emits once, when the action is picked.
   */
  persistent(key: TranslationKey, actionKey: TranslationKey): Observable<void> {
    const message: PersistentMessage = {
      key,
      actionKey,
      action$: new Subject<void>(),
    };
    this._persistent = message;
    if (!this._showing) this._showPersistent(message);
    return message.action$.asObservable();
  }

  private _showPersistent(message: PersistentMessage) {
    const ref = this._open(
      this._translate.instant(message.key),
      this._translate.instant(message.actionKey),
      { politeness: "polite" }
    );
    ref.onAction().subscribe(() => {
      this._persistent = null;
      message.action$.next();
      message.action$.complete();
    });
  }

  private _open(message: string, action?: string, config?: MatSnackBarConfig) {
    const id = ++this._lastId;
    this._showing = true;
    const ref = this._snackBar.open(message, action, config);
    ref.afterDismissed().subscribe(() => {
      // Replaced by a newer message, which brings the persistent one back
      // when it closes
      if (id !== this._lastId) return;
      this._showing = false;
      // Material dismisses its snackbars when the injector goes (a test's
      // teardown), and couldn't open another
      if (this._persistent && !this._destroyRef.destroyed)
        this._showPersistent(this._persistent);
    });
    return ref;
  }
}

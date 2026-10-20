import { Component, inject, Injectable } from "@angular/core";
import { MatButton } from "@angular/material/button";
import {
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
} from "@angular/material/dialog";
import {
  StronglyTypedDialog,
  TypedDialog,
} from "@app/shared/components/dialog/typedDialog";
import { TranslationKey } from "@app/shared/i18n/translations/translationKey";
import { TranslatePipe } from "@ngx-translate/core";
import { map, Observable } from "rxjs";

export interface ConfirmDialogData {
  // messageParams fills the message's placeholders
  title: TranslationKey;
  message: TranslationKey;
  messageParams?: Record<string, unknown>;
  confirmLabel?: TranslationKey;
  // Shows the confirm button in the error color, for actions that remove or
  // end something
  destructive?: boolean;
}

@Component({
  selector: "app-confirm-dialog",
  templateUrl: "./confirm.dialog.component.html",
  styleUrl: "./confirm.dialog.component.scss",
  imports: [
    MatButton,
    MatDialogActions,
    MatDialogClose,
    MatDialogContent,
    MatDialogTitle,
    TranslatePipe,
  ],
})
export class ConfirmDialogComponent extends StronglyTypedDialog<
  ConfirmDialogData,
  boolean
> {
  readonly options = this.data;
}

/** Asks for confirmation; emits true only when the user confirms. */
@Injectable({ providedIn: "root" })
export class ConfirmDialog {
  private readonly _dialog = inject(TypedDialog);

  confirm(data: ConfirmDialogData): Observable<boolean> {
    return this._dialog
      .open(ConfirmDialogComponent, { data, maxWidth: "440px" })
      .afterClosed()
      .pipe(map((confirmed) => confirmed === true));
  }
}

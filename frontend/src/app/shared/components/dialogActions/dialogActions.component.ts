import { Component, input, output } from "@angular/core";
import { MatButton } from "@angular/material/button";
import { MatDialogActions, MatDialogClose } from "@angular/material/dialog";
import { BusyDirective } from "@app/shared/directives/busy.directive";
import {
  t,
  TranslationKey,
} from "@app/shared/i18n/translations/translationKey";
import { TranslatePipe } from "@ngx-translate/core";

/**
 * A dialog's Cancel and primary button, the spinner on it while `busy`.
 * With `form` (the form's id) the button submits that form; otherwise it
 * emits `accept`. Other buttons are projected between the two.
 */
@Component({
  selector: "app-dialog-actions",
  templateUrl: "./dialogActions.component.html",
  styleUrl: "./dialogActions.component.scss",
  imports: [
    MatButton,
    MatDialogActions,
    MatDialogClose,
    BusyDirective,
    TranslatePipe,
  ],
})
export class DialogActionsComponent {
  readonly label = input<TranslationKey>(t("common.save"));
  // The primary button's name, for the specs
  readonly name = input("save");
  readonly busy = input(false);
  readonly disabled = input(false);
  // In the error color, for actions that remove or end something
  readonly destructive = input(false);
  readonly form = input<string>();
  // What the dialog closes with on Cancel
  readonly cancelResult = input<unknown>(false);
  readonly accept = output();
}

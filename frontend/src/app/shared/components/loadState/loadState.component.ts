import { Component, input } from "@angular/core";
import { MatProgressBar } from "@angular/material/progress-bar";
import { TranslationKey } from "@app/shared/i18n/translations/translationKey";
import { TranslatePipe } from "@ngx-translate/core";

/** What `*appLoaded` shows instead of its content: the progress bar while
 * it loads, else the message (that it failed, or that there's nothing). */
@Component({
  selector: "app-load-state",
  templateUrl: "./loadState.component.html",
  imports: [MatProgressBar, TranslatePipe],
})
export class LoadStateComponent {
  readonly message = input<TranslationKey | null>(null);
}

import { Component, input } from "@angular/core";
import { TranslationKey } from "@app/shared/i18n/translations/translationKey";
import { TranslatePipe } from "@ngx-translate/core";

/**
 * A page's title, with an optional subtitle and the page's actions (buttons
 * projected with the `pageActions` attribute) on the right.
 */
@Component({
  selector: "app-page-header",
  templateUrl: "./pageHeader.component.html",
  styleUrl: "./pageHeader.component.scss",
  imports: [TranslatePipe],
  // The title input's key would otherwise stay as the element's native
  // title, a tooltip over the whole component
  host: { "[attr.title]": "null" },
})
export class PageHeaderComponent {
  readonly title = input.required<TranslationKey>();
  readonly subtitle = input<TranslationKey>();
}

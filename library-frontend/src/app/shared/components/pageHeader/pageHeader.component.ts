import { Component, input } from "@angular/core";
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
})
export class PageHeaderComponent {
  // Translation keys
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
}

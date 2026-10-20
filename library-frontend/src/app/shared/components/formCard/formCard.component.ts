import { Component, input } from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import { TranslatePipe } from "@ngx-translate/core";

/**
 * The layout of a form page: a centred card with a title, the fields, and
 * the buttons (projected with the `formActions` attribute) at the bottom.
 * Put it inside the <form>, so the buttons stay in it:
 *
 *   <form [formGroup]="form" (ngSubmit)="save()">
 *     <app-form-card title="Create Book">
 *       <mat-form-field>…</mat-form-field>
 *       <button formActions matButton="filled" type="submit">…</button>
 *     </app-form-card>
 *   </form>
 */
@Component({
  selector: "app-form-card",
  templateUrl: "./formCard.component.html",
  styleUrl: "./formCard.component.scss",
  imports: [MatCardModule, TranslatePipe],
})
export class FormCardComponent {
  // Translation keys
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
}

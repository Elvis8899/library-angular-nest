import { Component, computed, input, viewChild } from "@angular/core";
import { toObservable, toSignal } from "@angular/core/rxjs-interop";
import { AbstractControl } from "@angular/forms";
import {
  MatAutocomplete,
  MatAutocompleteModule,
} from "@angular/material/autocomplete";
import { matching } from "@app/shared/utils/textMatch.utility";
import { startWith, switchMap } from "rxjs";

/**
 * A free-text field's suggestions: the earlier values that contain what
 * the control holds, ignoring accents and case, the value itself left out.
 * The field stays free text:
 *
 *   <input [matAutocomplete]="brands.panel()" formControlName="brand" />
 *   <app-suggestions #brands [control]="form.controls.brand" [values]="…" />
 */
@Component({
  selector: "app-suggestions",
  template: `<mat-autocomplete #panel="matAutocomplete">
    @for (value of shown(); track value) {
      <mat-option [value]="value">{{ value }}</mat-option>
    }
  </mat-autocomplete>`,
  imports: [MatAutocompleteModule],
})
export class SuggestionsComponent {
  readonly control = input.required<AbstractControl<string | null>>();
  readonly values = input.required<readonly string[]>();

  // The compiler wraps the query's argument in a function that only runs
  // outside tests, so coverage would count it as missed
  /* v8 ignore start */
  readonly panel = viewChild.required(MatAutocomplete);
  /* v8 ignore stop */

  private readonly _typed = toSignal(
    toObservable(this.control).pipe(
      switchMap((control) =>
        control.valueChanges.pipe(startWith(control.value)),
      ),
    ),
    { initialValue: "" },
  );

  readonly shown = computed(() => matching(this.values(), this._typed() ?? ""));
}

import {
  ComponentRef,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  untracked,
  ViewContainerRef,
} from "@angular/core";
import { MatProgressSpinner } from "@angular/material/progress-spinner";

/**
 * A button's spinner while its request runs, over the label, which stays
 * (hidden) so the button keeps its width. Holding the button stays its own
 * `[disabled]`, which may have other reasons:
 *
 *   <button matButton [appBusy]="saving()" [disabled]="saving()">
 */
@Directive({
  selector: "button[appBusy]",
  host: {
    "[class.app-busy]": "appBusy()",
    "[attr.aria-busy]": "appBusy() || null",
  },
})
export class BusyDirective {
  readonly appBusy = input.required<boolean>();

  private readonly _container = inject(ViewContainerRef);
  private readonly _button = inject<ElementRef<HTMLElement>>(ElementRef);
  private _spinner?: ComponentRef<MatProgressSpinner>;

  constructor() {
    effect(() => {
      const busy = this.appBusy();
      untracked(() => (busy ? this._show() : this._hide()));
    });
  }

  private _show(): void {
    this._spinner = this._container.createComponent(MatProgressSpinner);
    this._spinner.setInput("diameter", 20);
    this._spinner.setInput("mode", "indeterminate");
    // Created next to the button; moved inside it, over the label
    this._button.nativeElement.appendChild(
      this._spinner.location.nativeElement,
    );
  }

  private _hide(): void {
    this._spinner?.destroy();
    this._spinner = undefined;
  }
}

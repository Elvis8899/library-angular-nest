import {
  ComponentRef,
  Directive,
  effect,
  EmbeddedViewRef,
  inject,
  input,
  TemplateRef,
  untracked,
  ViewContainerRef,
} from "@angular/core";
import { LoadStateComponent } from "@app/shared/components/loadState/loadState.component";
import { TranslationKey } from "@app/shared/i18n/translations/translationKey";

export interface LoadedContext<T> {
  $implicit: T;
  appLoaded: T;
}

/**
 * A value loaded as undefined (loading), null (failed), then the value:
 * shows the progress bar, the `failed` message, the `empty` one for an
 * empty list, or the content with the value.
 *
 *   <ng-container *appLoaded="rows(); let rows; failed: 'x.failed'; empty: 'x.none'">
 */
@Directive({ selector: "[appLoaded]" })
export class LoadedDirective<T> {
  readonly appLoaded = input.required<T | null | undefined>();
  readonly appLoadedFailed = input.required<TranslationKey>();
  readonly appLoadedEmpty = input<TranslationKey>();

  private readonly _template =
    inject<TemplateRef<LoadedContext<T>>>(TemplateRef);
  private readonly _container = inject(ViewContainerRef);
  private _content?: EmbeddedViewRef<LoadedContext<T>>;
  private _state?: ComponentRef<LoadStateComponent>;

  constructor() {
    effect(() => {
      const value = this.appLoaded();
      const failed = this.appLoadedFailed();
      const empty = this.appLoadedEmpty();
      untracked(() => this._render(value, failed, empty));
    });
  }

  // Only the template type checker calls it, with this signature
  /* v8 ignore start */
  /* eslint-disable @typescript-eslint/no-unused-vars */
  static ngTemplateContextGuard<T>(
    _directive: LoadedDirective<T>,
    context: unknown,
  ): context is LoadedContext<T> {
    return true;
  }
  /* eslint-enable @typescript-eslint/no-unused-vars */
  /* v8 ignore stop */

  private _render(
    value: T | null | undefined,
    failed: TranslationKey,
    empty: TranslationKey | undefined,
  ) {
    if (value === undefined) {
      this._showState(null);
      return;
    }
    if (value === null) {
      this._showState(failed);
      return;
    }
    if (empty && Array.isArray(value) && value.length === 0) {
      this._showState(empty);
      return;
    }
    this._showContent(value);
  }

  private _showState(message: TranslationKey | null) {
    if (this._content) {
      this._container.clear();
      this._content = undefined;
    }
    this._state ??= this._container.createComponent(LoadStateComponent);
    this._state.setInput("message", message);
  }

  // A value that loads again keeps the content, with the new value
  private _showContent(value: T) {
    if (this._content) {
      this._content.context.$implicit = value;
      this._content.context.appLoaded = value;
      return;
    }
    this._container.clear();
    this._state = undefined;
    this._content = this._container.createEmbeddedView(this._template, {
      $implicit: value,
      appLoaded: value,
    });
  }
}

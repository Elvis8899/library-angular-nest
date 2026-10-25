import { Directive, input } from "@angular/core";

/**
 * Types an <ng-template>'s let- variables, which Angular leaves as any. The
 * input only carries the type:
 *
 *   readonly tableContext = templateContext<{ $implicit: Machine[] }>();
 *   <ng-template #table [appTemplateContext]="tableContext" let-rows>
 *
 * What an ngTemplateOutlet passes in isn't checked against it.
 */
@Directive({ selector: "ng-template[appTemplateContext]" })
export class TemplateContextDirective<Context> {
  readonly appTemplateContext = input.required<Context | null>();

  // Only the template type checker calls it, with this signature
  /* v8 ignore start */
  /* eslint-disable @typescript-eslint/no-unused-vars */
  static ngTemplateContextGuard<Context>(
    _directive: TemplateContextDirective<Context>,
    context: unknown
  ): context is Context {
    return true;
  }
  /* eslint-enable @typescript-eslint/no-unused-vars */
  /* v8 ignore stop */
}

/** A template context's type, for [appTemplateContext]. */
export const templateContext = <Context>(): Context | null => null;

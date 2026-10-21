import { registerLocaleData } from "@angular/common";
import localePt from "@angular/common/locales/pt";
import { inject, Signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { TranslateService } from "@ngx-translate/core";
import { map, startWith } from "rxjs";

// The pipes format with en-US data by default; pt-BR needs its own (R$ 39,90
// and 20/10/2026)
registerLocaleData(localePt, "pt-BR");

/**
 * The selected language as a locale for Angular's pipes (`currency`, `date`),
 * following language changes: `price | currency: "BRL" : "symbol" : undefined
 * : locale()`. Undefined before a language is set, which uses the default.
 */
export function injectCurrentLocale(): Signal<string | undefined> {
  const translate = inject(TranslateService);
  return toSignal(
    translate.onLangChange.pipe(
      map((event) => event.lang),
      startWith(translate.getCurrentLang()),
      map((lang) => lang || undefined)
    ),
    { requireSync: true }
  );
}

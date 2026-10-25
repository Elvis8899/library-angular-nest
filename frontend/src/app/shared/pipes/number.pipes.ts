import { Pipe, PipeTransform } from "@angular/core";
import { injectCurrentLocale } from "@app/shared/i18n/currentLocale";
import { moneyFormat, qtyFormat } from "@app/shared/utils/numberFormat.utility";

type Format = (locale: string | undefined) => (value: number) => string;

// Impure, as the language can change while the value doesn't: reading the
// language's signal here makes the template follow it. The formatter is
// built once per language
const inLanguage = (format: Format) => {
  const locale = injectCurrentLocale();
  let built:
    | { locale: string | undefined; format: (value: number) => string }
    | undefined;
  return (value: number): string => {
    const current = locale();
    if (!built || built.locale !== current)
      built = { locale: current, format: format(current) };
    return built.format(value);
  };
};

/** `{{ book.price | money }}`: "R$ 1.234,50". */
@Pipe({ name: "money", pure: false })
export class MoneyPipe implements PipeTransform {
  private readonly _format = inLanguage(moneyFormat);
  transform(value: number): string {
    return this._format(value);
  }
}

/** `{{ line.qty | qty }}`: up to 3 decimals, "1.234,5". */
@Pipe({ name: "qty", pure: false })
export class QtyPipe implements PipeTransform {
  private readonly _format = inLanguage(qtyFormat);
  transform(value: number): string {
    return this._format(value);
  }
}

import type { ptBRPages } from "@app/shared/i18n/translations/pages.pt-BR";
import { ptBR } from "@app/shared/i18n/translations/pt-BR";

export enum LanguagesEnum {
  EN_US = "en-US",
  PT_BR = "pt-BR",
}

/** pt-BR's shape with every text widened to string, for the other languages. */
type Shape<T> = { [K in keyof T]: T[K] extends string ? string : Shape<T[K]> };
export type CoreTranslations = Shape<typeof ptBR>;
export type PagesTranslations = Shape<typeof ptBRPages>;

/** Every leaf's dotted path: "common.cancel", "users.list.title"… */
type Paths<T> = {
  [K in keyof T & string]: T[K] extends string ? K : `${K}.${Paths<T[K]>}`;
}[keyof T & string];
export type TranslationKey = Paths<typeof ptBR & typeof ptBRPages>;

/**
 * Marks a translation key used from TypeScript, so the compiler checks it:
 * `translate.instant(t("users.created"))`. Returns the key unchanged.
 */
export const t = (key: TranslationKey): TranslationKey => key;

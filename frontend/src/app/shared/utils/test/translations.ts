import { ptBRPages } from "@app/shared/i18n/translations/pages.pt-BR";
import { ptBR } from "@app/shared/i18n/translations/pt-BR";
import { TranslateService } from "@ngx-translate/core";

/**
 * Every pt-BR text, at once: I18nService loads them asynchronously, the
 * pages' only with the layout.
 */
export const usePtBR = (translate: TranslateService) => {
  translate.setTranslation("pt-BR", { ...ptBR, ...ptBRPages });
  translate.use("pt-BR");
};

import type { InterpolationParameters, Language } from "@ngx-translate/core";

// ngx-translate types instant() as `any`; for one key it answers a string
// (the key itself when it has no text)
declare module "@ngx-translate/core" {
  interface TranslateService {
    instant(
      key: string,
      interpolateParams?: InterpolationParameters,
      lang?: Language,
    ): string;
  }
}

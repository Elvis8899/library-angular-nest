import { Component, inject } from "@angular/core";
import { MatButton } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import { MatMenuModule } from "@angular/material/menu";
import { injectCurrentLocale } from "@app/shared/i18n/currentLocale";
import { I18nService } from "@app/shared/i18n/i18n.service";
import { TranslatePipe } from "@ngx-translate/core";

// Each language in its own language, so people find theirs whatever the
// current one is
const languageNames: Record<string, string> = {
  "pt-BR": "Português",
  "en-US": "English",
};

/** A menu with the supported languages. */
@Component({
  selector: "app-language-selector",
  templateUrl: "./languageSelector.component.html",
  imports: [MatButton, MatIcon, MatMenuModule, TranslatePipe],
})
export class LanguageSelectorComponent {
  private readonly _i18nService = inject(I18nService);

  readonly languages = this._i18nService.supportedLanguages;
  readonly currentLanguage = injectCurrentLocale();

  languageName(language: string | undefined): string {
    return (language && languageNames[language]) || language || "";
  }

  // "pt-BR" → "PT", for the button
  shortName(language: string | undefined): string {
    return (language ?? "").split("-")[0].toUpperCase();
  }

  setLanguage(language: string) {
    void this._i18nService.setLanguage(language);
  }
}

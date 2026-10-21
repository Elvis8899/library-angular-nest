import { DOCUMENT, inject, Injectable, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Title } from "@angular/platform-browser";
import { ActivatedRoute, NavigationEnd, Router } from "@angular/router";
import { Logger } from "@app/services/logger.service";
import { enUS, ptBR } from "@app/shared/i18n/translations";
import {
  LanguagesEnum,
  t,
  Translations,
} from "@app/shared/i18n/translations/translationKey";
import { environment } from "@env/environment";
import { TranslateService } from "@ngx-translate/core";
import { filter, merge } from "rxjs";

const log = new Logger("I18nService");
const languageKey = "language";

@Injectable({
  providedIn: "root",
})
export class I18nService {
  defaultLanguage!: string;
  readonly supportedLanguages = signal<string[]>([]);

  private readonly _translateService = inject(TranslateService);
  private readonly _router = inject(Router);
  private readonly _titleService = inject(Title);
  private readonly _document = inject(DOCUMENT);

  constructor() {
    // Remembers the language for the next visit, and tells the browser and
    // screen readers which language the page is in
    this._translateService.onLangChange
      .pipe(takeUntilDestroyed())
      .subscribe((event) => {
        localStorage.setItem(languageKey, event.lang);
        this._document.documentElement.lang = event.lang;
      });
    // Embed languages to avoid extra HTTP requests
    const translations: [LanguagesEnum, Translations][] = [
      [LanguagesEnum.PT_BR, ptBR],
      [LanguagesEnum.EN_US, enUS],
    ];
    translations.forEach(([lang, translations]) => {
      this._translateService.setTranslation(lang, translations);
    });
    this.init(environment.defaultLanguage, environment.supportedLanguages);

    const onNavigationEnd = this._router.events.pipe(
      filter((event) => event instanceof NavigationEnd)
    );

    merge(this._translateService.onLangChange, onNavigationEnd)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.setTitle());
  }

  private getTitleRecursive(route: ActivatedRoute): string[] {
    const routeTitle: string = route.snapshot.data?.["title"];
    const titleFragments: string[] = routeTitle ? [routeTitle] : [];
    const routeChild = route?.firstChild;
    if (routeChild) {
      titleFragments.push(...this.getTitleRecursive(routeChild));
    }
    return titleFragments;
  }

  getTitle(route: ActivatedRoute): string[] {
    return this.getTitleRecursive(route);
  }

  /**
   * Gets the current language.
   * @return The current language code.
   */
  get language(): string {
    return this._translateService.getCurrentLang() ?? this.defaultLanguage;
  }

  /**
   * Sets the current language.
   * Note: The current language is saved to the local storage.
   * If no parameter is specified, the language is loaded from local storage (if present).
   * @param language The IETF language code to set.
   */
  setLanguage(language: string) {
    let newLanguage =
      language ||
      localStorage.getItem(languageKey) ||
      environment.defaultLanguage;
    let isSupportedLanguage = this.supportedLanguages().includes(newLanguage);

    // If no exact match is found, search without the region
    if (newLanguage && !isSupportedLanguage) {
      newLanguage = newLanguage.split("-")[0];
      newLanguage =
        this.supportedLanguages().find((supportedLanguage) =>
          supportedLanguage.startsWith(newLanguage)
        ) || "";
      isSupportedLanguage = Boolean(newLanguage);
    }

    // Fallback if language is not supported
    if (!newLanguage || !isSupportedLanguage) {
      newLanguage = this.defaultLanguage;
    }

    log.debug(`Language set to ${newLanguage}`);
    this._translateService.use(newLanguage);
  }

  /**
   * Initializes i18n for the application.
   * Loads language from local storage if present, or sets default language.
   * @param defaultLanguage The default language to use.
   * @param supportedLanguages The list of supported languages.
   */
  init(defaultLanguage: string, supportedLanguages: string[]) {
    this.defaultLanguage = defaultLanguage;
    this.supportedLanguages.set(supportedLanguages);
    log.debug(`Initializing with default language: ${defaultLanguage}`);
    this.setLanguage("");
  }

  setTitle() {
    const instantFn = (v: string) => this._translateService.instant(v);
    this._titleService.setTitle(this.getNextTitle(instantFn));
  }

  getNextTitle(translator: (v: string) => string = (v) => v): string {
    const titles = this.getTitle(this._router.routerState.root);

    let title = translator(t("app.home"));

    if (titles.length) {
      const translatedTitles = titles.map(translator);
      const allTitlesSame = translatedTitles.every(
        (title, _, arr) => title === arr[0]
      );
      title = allTitlesSame
        ? translatedTitles[0]
        : translatedTitles.join(" | ");
    }
    return title;
  }
}

import { DOCUMENT, inject, Injectable, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Title } from "@angular/platform-browser";
import { ActivatedRoute, NavigationEnd, Router } from "@angular/router";
import { Logger } from "@app/services/logger.service";
import { ptBR } from "@app/shared/i18n/translations/pt-BR";
import { LanguagesEnum, t } from "@app/shared/i18n/translations/translationKey";
import { environment } from "@env/environment";
import { TranslateService, TranslationObject } from "@ngx-translate/core";
import { filter, merge } from "rxjs";

const log = new Logger("I18nService");
const languageKey = "language";

// A language's texts come in two parts: core (the login, the layout, the API's
// errors) and pages, loaded with the layout. Only pt-BR's core is in the
// bundle; the rest are chunks loaded when needed.
type Part = "core" | "pages";
export const textFiles: Record<
  string,
  Record<Part, () => Promise<TranslationObject>>
> = {
  [LanguagesEnum.PT_BR]: {
    core: async () => ptBR,
    pages: () =>
      import("@app/shared/i18n/translations/pages.pt-BR").then(
        (m) => m.ptBRPages
      ),
  },
  [LanguagesEnum.EN_US]: {
    core: () =>
      import("@app/shared/i18n/translations/en-US").then((m) => m.enUS),
    pages: () =>
      import("@app/shared/i18n/translations/pages.en-US").then(
        (m) => m.enUSPages
      ),
  },
};

@Injectable({
  providedIn: "root",
})
export class I18nService {
  defaultLanguage!: string;
  readonly supportedLanguages = signal<string[]>([]);
  /** Settles when the saved language's core texts are in use. */
  readonly ready: Promise<void>;

  // "pt-BR/core" → its load, so each part is loaded once
  private readonly _loads = new Map<string, Promise<void>>();
  private _pagesNeeded = false;
  // The latest setLanguage, so an earlier one that loads slower doesn't win
  private _languageRequest = 0;

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
    this.ready = this.init(
      environment.defaultLanguage,
      environment.supportedLanguages
    );

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
   * Its texts are loaded first, so the screen never shows the keys.
   * @param language The IETF language code to set.
   */
  async setLanguage(language: string): Promise<void> {
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

    const request = ++this._languageRequest;
    // Both at once; each merges into the language's texts
    await Promise.all([
      this.load(newLanguage, "core"),
      this._pagesNeeded ? this.load(newLanguage, "pages") : undefined,
    ]);
    if (request === this._languageRequest) {
      log.debug(`Language set to ${newLanguage}`);
      this._translateService.use(newLanguage);
    }
  }

  /**
   * Loads the pages' texts, in the current language and in any picked later.
   * The layout route resolves it, so a page never shows the keys.
   */
  loadPages(): Promise<void> {
    this._pagesNeeded = true;
    return this.load(this.language, "pages");
  }

  private load(language: string, part: Part): Promise<void> {
    const key = `${language}/${part}`;
    const loading =
      this._loads.get(key) ??
      (textFiles[language]?.[part]() ?? Promise.resolve(null)).then(
        (texts) => {
          if (texts) {
            this._translateService.setTranslation(language, texts, true);
          }
        },
        (error: unknown) => {
          // Tried again next time, as a failed chunk is (a new deploy, offline)
          this._loads.delete(key);
          throw error;
        }
      );
    this._loads.set(key, loading);
    return loading;
  }

  /**
   * Initializes i18n for the application.
   * Loads language from local storage if present, or sets default language.
   * @param defaultLanguage The default language to use.
   * @param supportedLanguages The list of supported languages.
   */
  init(defaultLanguage: string, supportedLanguages: string[]): Promise<void> {
    this.defaultLanguage = defaultLanguage;
    this.supportedLanguages.set(supportedLanguages);
    log.debug(`Initializing with default language: ${defaultLanguage}`);
    return this.setLanguage("");
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

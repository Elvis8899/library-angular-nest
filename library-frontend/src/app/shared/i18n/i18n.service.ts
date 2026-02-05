import { inject, Injectable } from "@angular/core";
import { Title } from "@angular/platform-browser";
import { ActivatedRoute, NavigationEnd, Router } from "@angular/router";
import { Logger } from "@app/services/logger.service";
import { enUS, ptBR } from "@app/shared/i18n/translations";
import {
  AllTranslations,
  LanguagesEnum,
} from "@app/shared/i18n/translations/allTranslations";
import { environment } from "@env/environment";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { LangChangeEvent, TranslateService } from "@ngx-translate/core";
import { BehaviorSubject, filter, merge, Subscription } from "rxjs";

const log = new Logger("I18nService");
const languageKey = "language";

@UntilDestroy()
@Injectable({
  providedIn: "root",
})
export class I18nService {
  title = "library-frontend";
  defaultLanguage!: string;
  supportedLanguages = new BehaviorSubject<string[]>([]);

  langChangeSubscription!: Subscription;
  private readonly _languageSubject: BehaviorSubject<string>;
  private readonly _translateService = inject(TranslateService);
  private readonly _router = inject(Router);
  private readonly _titleService = inject(Title);

  constructor() {
    // Initialize the BehaviorSubject with an initial value
    this._languageSubject = new BehaviorSubject<string>(
      localStorage.getItem(languageKey) || environment.defaultLanguage
    );
    // Warning: this subscription will always be alive for the app's lifetime
    this.langChangeSubscription = this._translateService.onLangChange.subscribe(
      (event: LangChangeEvent) => {
        localStorage.setItem(languageKey, event.lang);
      }
    );
    // Embed languages to avoid extra HTTP requests
    const translations: [LanguagesEnum, AllTranslations][] = [
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
      .pipe(untilDestroyed(this))
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
    return this._translateService.currentLang;
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
    let isSupportedLanguage = this.supportedLanguages
      .getValue()
      .includes(newLanguage);

    if (language !== this._languageSubject.value) {
      this._languageSubject.next(newLanguage);
    }

    // If no exact match is found, search without the region
    if (newLanguage && !isSupportedLanguage) {
      newLanguage = newLanguage.split("-")[0];
      newLanguage =
        this.supportedLanguages
          .getValue()
          .find((supportedLanguage) =>
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
    this.supportedLanguages.next(supportedLanguages);
    log.debug(`Initializing with default language: ${defaultLanguage}`);
    this.setLanguage("");
  }

  setTitle() {
    const instantFn = (v: string) => this._translateService.instant(v);
    this._titleService.setTitle(this.getNextTitle(instantFn));
  }

  getNextTitle(translator: (v: string) => string = (v) => v): string {
    const titles = this.getTitle(this._router.routerState.root);

    let title = translator("Home");

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
  /**
   * Cleans up language change subscription.
   */
  destroy() {
    if (!this.langChangeSubscription || this.langChangeSubscription?.closed) {
      return;
    }
    this.langChangeSubscription.unsubscribe();
  }
}

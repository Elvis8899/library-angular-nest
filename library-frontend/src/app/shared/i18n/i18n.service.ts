import { inject, Injectable } from "@angular/core";
import { Title } from "@angular/platform-browser";
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterState,
} from "@angular/router";
import { Logger } from "@app/services/logger.service";
import { enUS, ptBR } from "@app/shared/i18n/translations";
import { LanguagesEnum } from "@app/shared/i18n/translations/allTranslations";
import { environment } from "@env/environment";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { LangChangeEvent, TranslateService } from "@ngx-translate/core";
import { BehaviorSubject, filter, merge, Observable, Subscription } from "rxjs";

const log = new Logger("I18nService");
const languageKey = "language";

@UntilDestroy()
@Injectable({
  providedIn: "root",
})
export class I18nService {
  title = "library-frontend";
  defaultLanguage!: string;
  supportedLanguages!: string[];

  private _langChangeSubscription!: Subscription;
  private readonly _languageSubject: BehaviorSubject<string>;
  private readonly _translateService = inject(TranslateService);
  private readonly _router = inject(Router);
  private readonly _titleService = inject(Title);

  constructor() {
    // Initialize the BehaviorSubject with an initial value
    this._languageSubject = new BehaviorSubject<string>(
      localStorage.getItem(languageKey) ||
        environment.defaultLanguage ||
        this._translateService.getBrowserCultureLang() ||
        ""
    );
    // Embed languages to avoid extra HTTP requests
    this._translateService.setTranslation(LanguagesEnum.PT_BR, ptBR);
    this._translateService.setTranslation(LanguagesEnum.EN_US, enUS);
    this.init(environment.defaultLanguage, environment.supportedLanguages);

    const onNavigationEnd = this._router.events.pipe(
      filter((event) => event instanceof NavigationEnd)
    );

    merge(this._translateService.onLangChange, onNavigationEnd)
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        const titles = this.getTitle(
          this._router.routerState,
          this._router.routerState.root
        );
        if (!this._translateService?.instant) {
          return;
        }
        if (titles.length === 0) {
          this._titleService.setTitle(this._translateService.instant("Home"));
        } else {
          const translatedTitles = titles.map((titlePart) =>
            this._translateService.instant(titlePart)
          );
          const allTitlesSame = translatedTitles.every(
            (title, _, arr) => title === arr[0]
          );
          this._titleService.setTitle(
            allTitlesSame ? translatedTitles[0] : translatedTitles.join(" | ")
          );
        }
      });
  }

  getTitle(state: RouterState, parent: ActivatedRoute): string[] {
    const data: string[] = [];
    if (parent && parent.snapshot.data && parent.snapshot.data["title"]) {
      data.push(parent.snapshot.data["title"]);
    }

    if (state && parent?.firstChild) {
      data.push(...this.getTitle(state, parent?.firstChild));
    }
    return data;
  }

  /**
   * Returns the current language as an observable.
   * @return Observable of the current language.
   */
  get languageObservable(): Observable<string> {
    return this._languageSubject.asObservable();
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
  set language(language: string) {
    let newLanguage =
      language ||
      localStorage.getItem(languageKey) ||
      environment.defaultLanguage ||
      this._translateService.getBrowserCultureLang() ||
      "";
    let isSupportedLanguage = this.supportedLanguages.includes(newLanguage);

    if (language !== this._languageSubject.value) {
      this._languageSubject.next(newLanguage);
    }

    // If no exact match is found, search without the region
    if (newLanguage && !isSupportedLanguage) {
      newLanguage = newLanguage.split("-")[0];
      newLanguage =
        this.supportedLanguages.find((supportedLanguage) =>
          supportedLanguage.startsWith(newLanguage)
        ) || "";
      isSupportedLanguage = Boolean(newLanguage);
    }

    // Fallback if language is not supported
    if (!newLanguage || !isSupportedLanguage) {
      newLanguage = this.defaultLanguage;
    }

    language = newLanguage;

    log.debug(`Language set to ${language}`);
    this._translateService.use(language);
  }

  /**
   * Initializes i18n for the application.
   * Loads language from local storage if present, or sets default language.
   * @param defaultLanguage The default language to use.
   * @param supportedLanguages The list of supported languages.
   */
  init(defaultLanguage: string, supportedLanguages: string[]) {
    this.defaultLanguage = defaultLanguage;
    this.supportedLanguages = supportedLanguages;
    log.debug(`Initializing with default language: ${defaultLanguage}`);
    this.language = "";

    // Warning: this subscription will always be alive for the app's lifetime
    this._langChangeSubscription =
      this._translateService.onLangChange.subscribe(
        (event: LangChangeEvent) => {
          localStorage.setItem(languageKey, event.lang);
        }
      );
  }

  /**
   * Cleans up language change subscription.
   */
  destroy() {
    if (this._langChangeSubscription) {
      this._langChangeSubscription.unsubscribe();
    }
  }
}

import { TestBed } from "@angular/core/testing";
import { Event, NavigationEnd, Router } from "@angular/router";
import { Logger } from "@app/services/logger.service";
import { I18nService } from "@app/shared/i18n/i18n.service";
import { LangChangeEvent, TranslateService } from "@ngx-translate/core";
import { noop, Subject } from "rxjs";
import { vi, type Mock } from "vitest";

Logger.level = 0;

const defaultLanguage = "en-US";
const supportedLanguages = ["eo", "en-US", "fr-FR"];

class MockTranslateService {
  currentLang = "";
  onLangChange = new Subject();

  setTranslation = noop;
  use(language: string) {
    this.currentLang = language;
    this.onLangChange.next({
      lang: this.currentLang,
      translations: {},
    });
  }

  getBrowserCultureLang() {
    return "en-US";
  }
}

describe("I18nService", () => {
  let i18nService: I18nService;
  let translateService: TranslateService;
  let onLangChangeSpy: Mock;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        I18nService,
        { provide: TranslateService, useClass: MockTranslateService },
      ],
    });

    i18nService = TestBed.inject(I18nService);
    translateService = TestBed.inject(TranslateService);

    // Create spies
    onLangChangeSpy = vi.fn();
    translateService.onLangChange.subscribe((event: LangChangeEvent) => {
      onLangChangeSpy(event.lang);
    });
    vi.spyOn(translateService, "use");
  });

  afterEach(() => {
    // Cleanup
    localStorage.removeItem("language");
  });

  describe("init", () => {
    it("should init with default language", () => {
      // Act
      i18nService.init(defaultLanguage, supportedLanguages);

      // Assert
      expect(translateService.use).toHaveBeenCalledWith(defaultLanguage);
      expect(onLangChangeSpy).toHaveBeenCalledWith(defaultLanguage);
    });

    it("should init with save language", () => {
      // Arrange
      const savedLanguage = "eo";
      localStorage.setItem("language", savedLanguage);

      // Act
      i18nService.init(defaultLanguage, supportedLanguages);

      // Assert
      expect(translateService.use).toHaveBeenCalledWith(savedLanguage);
      expect(onLangChangeSpy).toHaveBeenCalledWith(savedLanguage);
    });
  });

  describe("set language", () => {
    it("should change current language", () => {
      // Arrange
      const newLanguage = "eo";
      i18nService.init(defaultLanguage, supportedLanguages);

      // Act
      i18nService.language = newLanguage;

      // Assert
      expect(translateService.use).toHaveBeenCalledWith(newLanguage);
      expect(onLangChangeSpy).toHaveBeenCalledWith(newLanguage);
    });

    it("should change current language without a region match", () => {
      // Arrange
      const newLanguage = "fr-CA";
      i18nService.init(defaultLanguage, supportedLanguages);

      // Act
      i18nService.language = newLanguage;

      // Assert
      expect(translateService.use).toHaveBeenCalledWith("fr-FR");
      expect(onLangChangeSpy).toHaveBeenCalledWith("fr-FR");
    });

    it("should change current language to default if unsupported", () => {
      // Arrange
      const newLanguage = "es";
      i18nService.init(defaultLanguage, supportedLanguages);

      // Act
      i18nService.language = newLanguage;

      // Assert
      expect(translateService.use).toHaveBeenCalledWith(defaultLanguage);
      expect(onLangChangeSpy).toHaveBeenCalledWith(defaultLanguage);
    });

    it("Pipe should be activated on Router NavigationEnd", () => {
      // Arrange
      i18nService.init(defaultLanguage, supportedLanguages);
      const router = TestBed.inject(Router);
      const event = new NavigationEnd(1703, `/book/list`, "/");
      (router.events as Subject<Event>).next(event);
      // Assert
      // expect(onNavigationEnd).toHaveBeenCalled();
    });
  });

  describe("get language", () => {
    it("should return current language", () => {
      // Arrange
      i18nService.init(defaultLanguage, supportedLanguages);

      // Act
      const currentLanguage = i18nService.language;

      // Assert
      expect(currentLanguage).toEqual(defaultLanguage);
    });
  });

  describe("on  destroy", () => {
    it("should clean up", () => {
      // Arrange
      i18nService.init(defaultLanguage, supportedLanguages);

      // Act
      i18nService.destroy();
      // Assert
      expect(i18nService.langChangeSubscription.closed).toBe(true);
    });
  });
});

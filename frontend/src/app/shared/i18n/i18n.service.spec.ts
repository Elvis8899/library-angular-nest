import { ActivatedRoute, NavigationEnd, Router } from "@angular/router";
import { Logger } from "@app/services/logger.service";
import { I18nService, textFiles } from "@app/shared/i18n/i18n.service";
import { enUS } from "@app/shared/i18n/translations/en-US";
import { enUSPages } from "@app/shared/i18n/translations/pages.en-US";
import { ptBRPages } from "@app/shared/i18n/translations/pages.pt-BR";
import {
  LangChangeEvent,
  TranslateService,
  TranslationObject,
} from "@ngx-translate/core";
import {
  createServiceFactory,
  SpectatorService,
} from "@openng/spectator/vitest";
import { noop, Subject } from "rxjs";
import { vi, type Mock } from "vitest";

Logger.level = 0;

const defaultLanguage = "en-US";
const supportedLanguages = ["eo", "en-US", "fr-FR"];

class MockTranslateService {
  currentLang = "";
  onLangChange = new Subject();

  getCurrentLang() {
    return this.currentLang;
  }

  instant: (key: string) => string = vi.fn((key) => key);

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
  let translateService: TranslateService;
  let onLangChangeSpy: Mock;

  let spectator: SpectatorService<I18nService>;
  const createService = createServiceFactory({
    service: I18nService,
    providers: [{ provide: TranslateService, useClass: MockTranslateService }],
  });
  beforeEach(() => {
    spectator = createService();
    // Create spies
    onLangChangeSpy = vi.fn();
    translateService = spectator.inject(TranslateService);
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
    it("should init with default language", async () => {
      // Act
      await spectator.service.init(defaultLanguage, supportedLanguages);

      // Assert
      expect(translateService.use).toHaveBeenCalledWith(defaultLanguage);
      expect(onLangChangeSpy).toHaveBeenCalledWith(defaultLanguage);
    });

    it("should init with save language", async () => {
      // Arrange
      const savedLanguage = "eo";
      localStorage.setItem("language", savedLanguage);

      // Act
      await spectator.service.init(defaultLanguage, supportedLanguages);

      // Assert
      expect(translateService.use).toHaveBeenCalledWith(savedLanguage);
      expect(onLangChangeSpy).toHaveBeenCalledWith(savedLanguage);
    });
  });

  describe("set language", () => {
    it("should change current language", async () => {
      // Arrange
      const newLanguage = "eo";
      await spectator.service.init(defaultLanguage, supportedLanguages);

      // Act
      await spectator.service.setLanguage(newLanguage);

      // Assert
      expect(translateService.use).toHaveBeenCalledWith(newLanguage);
      expect(onLangChangeSpy).toHaveBeenCalledWith(newLanguage);
    });

    it("should change current language without a region match", async () => {
      // Arrange
      const newLanguage = "fr-CA";
      await spectator.service.init(defaultLanguage, supportedLanguages);

      // Act
      await spectator.service.setLanguage(newLanguage);

      // Assert
      expect(translateService.use).toHaveBeenCalledWith("fr-FR");
      expect(onLangChangeSpy).toHaveBeenCalledWith("fr-FR");
    });

    it("should change current language to default if unsupported", async () => {
      // Arrange
      const newLanguage = "es";
      await spectator.service.init(defaultLanguage, supportedLanguages);

      // Act
      await spectator.service.setLanguage(newLanguage);

      // Assert
      expect(translateService.use).toHaveBeenCalledWith(defaultLanguage);
      expect(onLangChangeSpy).toHaveBeenCalledWith(defaultLanguage);
    });

    it("should change current language", async () => {
      // Arrange
      await spectator.service.init("", supportedLanguages);
      localStorage.clear();

      // Act
      await spectator.service.setLanguage("");

      // Assert
      expect(translateService.use).toHaveBeenCalledWith("");
      expect(onLangChangeSpy).toHaveBeenCalledWith("");
    });
  });

  describe("set title", () => {
    it("Pipe should be activated on Router NavigationEnd", async () => {
      // Arrange
      await spectator.service.init(defaultLanguage, supportedLanguages);
      const spy = vi.spyOn(spectator.service, "setTitle");
      const router = spectator.inject(Router);
      const event = new NavigationEnd(1703, `/users/list`, "/");
      (router.events as unknown as Subject<Event>).next(
        event as unknown as Event
      );
      // Assert
      expect(spy).toHaveBeenCalled();
    });
  });

  describe("get language", () => {
    it("should return current language", async () => {
      // Arrange
      await spectator.service.init(defaultLanguage, supportedLanguages);

      // Act
      const currentLanguage = spectator.service.language;

      // Assert
      expect(currentLanguage).toEqual(defaultLanguage);
    });

    it("should return the default language before one is in use", async () => {
      // Arrange
      await spectator.service.init(defaultLanguage, supportedLanguages);
      vi.spyOn(translateService, "getCurrentLang").mockReturnValue(null);

      // Act
      const currentLanguage = spectator.service.language;

      // Assert
      expect(currentLanguage).toEqual(defaultLanguage);
    });
  });

  describe("get titles", () => {
    it("should return 2 titles when route has children", () => {
      // Arrange
      const routeMock = {
        snapshot: { data: { title: "title" } },
        firstChild: {
          snapshot: { data: { title: "title1" } },
          firstChild: { snapshot: { data: { title: "title2" } } },
        },
      } as object as ActivatedRoute;

      // Act
      const res = spectator.service["getTitleRecursive"](routeMock);

      // Assert
      expect(res).toEqual(["title", "title1", "title2"]);
    });
  });

  describe("setTitle", () => {
    it("should set title", async () => {
      // Arrange
      await spectator.service.init(defaultLanguage, supportedLanguages);
      const spy = vi.spyOn(spectator.service, "getTitle");
      spy.mockReturnValueOnce(["title", "title1", "title2"]);
      // Act
      spectator.service.setTitle();
    });

    it("should set title", async () => {
      // Arrange
      await spectator.service.init(defaultLanguage, supportedLanguages);
      const spy = vi.spyOn(spectator.service, "getTitle");
      spy.mockReturnValueOnce([]);
      // Act
      spectator.service.setTitle();
    });

    it("should set title without fn", async () => {
      // Arrange
      await spectator.service.init(defaultLanguage, supportedLanguages);
      const spy = vi.spyOn(spectator.service, "getTitle");
      const newTitle = "Test1";
      spy.mockReturnValueOnce([newTitle]);
      // Act
      const title = spectator.service.getNextTitle();
      // Assert
      expect(title).toBe(newTitle);
    });
  });

  it("Should remember the selected language", async () => {
    // Arrange
    await spectator.service.init(defaultLanguage, supportedLanguages);
    // Act
    await spectator.service.setLanguage("fr-FR");
    // Assert
    expect(localStorage.getItem("language")).toBe("fr-FR");
    expect(document.documentElement.lang).toBe("fr-FR");
  });

  describe("texts", () => {
    const languages = ["pt-BR", "en-US"];

    beforeEach(() => vi.spyOn(translateService, "setTranslation"));

    it("Should load a language's core texts once, before using it", async () => {
      // The service started in pt-BR, which loaded its core
      await spectator.service.init("pt-BR", languages);
      await spectator.service.setLanguage("en-US");
      await spectator.service.setLanguage("en-US");

      expect(translateService.setTranslation).toHaveBeenCalledExactlyOnceWith(
        "en-US",
        enUS,
        true
      );
      expect(translateService.use).toHaveBeenLastCalledWith("en-US");
    });

    it("Should load the pages' texts once, and with a language picked later", async () => {
      await spectator.service.init("pt-BR", languages);
      await spectator.service.loadPages();
      await spectator.service.loadPages();
      await spectator.service.setLanguage("en-US");

      expect(translateService.setTranslation).toHaveBeenCalledWith(
        "pt-BR",
        ptBRPages,
        true
      );
      expect(translateService.setTranslation).toHaveBeenCalledWith(
        "en-US",
        enUSPages,
        true
      );
      // pt-BR's pages, en-US's core and pages
      expect(translateService.setTranslation).toHaveBeenCalledTimes(3);
    });

    it("Should keep the language picked last", async () => {
      await spectator.service.init("pt-BR", languages);
      let loaded: (texts: TranslationObject) => void = noop;
      vi.spyOn(textFiles["en-US"], "core").mockReturnValueOnce(
        new Promise((resolve) => (loaded = resolve))
      );
      const slower = spectator.service.setLanguage("en-US");
      await spectator.service.setLanguage("pt-BR");
      loaded(enUS);
      await slower;

      expect(translateService.use).toHaveBeenLastCalledWith("pt-BR");
    });

    it("Should try a part that failed to load again", async () => {
      await spectator.service.init("pt-BR", languages);
      const error = new Error("Failed to fetch dynamically imported module");
      vi.spyOn(textFiles["pt-BR"], "pages").mockRejectedValueOnce(error);

      await expect(spectator.service.loadPages()).rejects.toBe(error);
      await spectator.service.loadPages();

      expect(translateService.setTranslation).toHaveBeenCalledWith(
        "pt-BR",
        ptBRPages,
        true
      );
    });
  });
});

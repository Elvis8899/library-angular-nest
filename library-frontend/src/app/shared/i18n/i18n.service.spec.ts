import { ActivatedRoute, NavigationEnd, Router } from "@angular/router";
import { Logger } from "@app/services/logger.service";
import { I18nService } from "@app/shared/i18n/i18n.service";
import { createServiceFactory, SpectatorService } from "@ngneat/spectator";
import { LangChangeEvent, TranslateService } from "@ngx-translate/core";
import { noop, Subject } from "rxjs";
import { vi, type Mock } from "vitest";

Logger.level = 0;

const defaultLanguage = "en-US";
const supportedLanguages = ["eo", "en-US", "fr-FR"];

class MockTranslateService {
  currentLang = "";
  onLangChange = new Subject();

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
    it("should init with default language", () => {
      // Act
      spectator.service.init(defaultLanguage, supportedLanguages);

      // Assert
      expect(translateService.use).toHaveBeenCalledWith(defaultLanguage);
      expect(onLangChangeSpy).toHaveBeenCalledWith(defaultLanguage);
    });

    it("should init with save language", () => {
      // Arrange
      const savedLanguage = "eo";
      localStorage.setItem("language", savedLanguage);

      // Act
      spectator.service.init(defaultLanguage, supportedLanguages);

      // Assert
      expect(translateService.use).toHaveBeenCalledWith(savedLanguage);
      expect(onLangChangeSpy).toHaveBeenCalledWith(savedLanguage);
    });
  });

  describe("set language", () => {
    it("should change current language", () => {
      // Arrange
      const newLanguage = "eo";
      spectator.service.init(defaultLanguage, supportedLanguages);

      // Act
      spectator.service.setLanguage(newLanguage);

      // Assert
      expect(translateService.use).toHaveBeenCalledWith(newLanguage);
      expect(onLangChangeSpy).toHaveBeenCalledWith(newLanguage);
    });

    it("should change current language without a region match", () => {
      // Arrange
      const newLanguage = "fr-CA";
      spectator.service.init(defaultLanguage, supportedLanguages);

      // Act
      spectator.service.setLanguage(newLanguage);

      // Assert
      expect(translateService.use).toHaveBeenCalledWith("fr-FR");
      expect(onLangChangeSpy).toHaveBeenCalledWith("fr-FR");
    });

    it("should change current language to default if unsupported", () => {
      // Arrange
      const newLanguage = "es";
      spectator.service.init(defaultLanguage, supportedLanguages);

      // Act
      spectator.service.setLanguage(newLanguage);

      // Assert
      expect(translateService.use).toHaveBeenCalledWith(defaultLanguage);
      expect(onLangChangeSpy).toHaveBeenCalledWith(defaultLanguage);
    });

    it("should change current language", () => {
      // Arrange
      spectator.service.init("", supportedLanguages);
      localStorage.clear();

      // Act
      spectator.service.setLanguage("");

      // Assert
      expect(translateService.use).toHaveBeenCalledWith("");
      expect(onLangChangeSpy).toHaveBeenCalledWith("");
    });
  });

  describe("set title", () => {
    it("Pipe should be activated on Router NavigationEnd", () => {
      // Arrange
      spectator.service.init(defaultLanguage, supportedLanguages);
      const spy = vi.spyOn(spectator.service, "setTitle");
      const router = spectator.inject(Router);
      const event = new NavigationEnd(1703, `/book/list`, "/");
      (router.events as unknown as Subject<Event>).next(
        event as unknown as Event
      );
      // Assert
      expect(spy).toHaveBeenCalled();
    });
  });

  describe("get language", () => {
    it("should return current language", () => {
      // Arrange
      spectator.service.init(defaultLanguage, supportedLanguages);

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
    it("should set title", () => {
      // Arrange
      spectator.service.init(defaultLanguage, supportedLanguages);
      const spy = vi.spyOn(spectator.service, "getTitle");
      spy.mockReturnValueOnce(["title", "title1", "title2"]);
      // Act
      spectator.service.setTitle();
      // Assert
      // expect(onLangChangeSpy).toHaveBeenCalledWith("title");
    });

    it("should set title", () => {
      // Arrange
      spectator.service.init(defaultLanguage, supportedLanguages);
      const spy = vi.spyOn(spectator.service, "getTitle");
      spy.mockReturnValueOnce([]);
      // Act
      spectator.service.setTitle();
      // Assert
      // expect(onLangChangeSpy).toHaveBeenCalledWith("title");
    });

    it("should set title without fn", () => {
      // Arrange
      spectator.service.init(defaultLanguage, supportedLanguages);
      const spy = vi.spyOn(spectator.service, "getTitle");
      const newTitle = "Test1";
      spy.mockReturnValueOnce([newTitle]);
      // Act
      const title = spectator.service.getNextTitle();
      // Assert
      expect(title).toBe(newTitle);
    });
    // it("should set title", () => {
    //   // Arrange
    //   spectator.service.init(defaultLanguage, supportedLanguages);
    //   const spy = vi.spyOn(spectator.service, "getTitle");
    //   spy.mockResolvedValueOnce([]);
    //   const translateService = spectator.inject(TranslateService);
    //   const translateSpy = vi.spyOn(translateService, "instant");
    //   (translateService as unknown as Mock).mockReturnValue(null);
    //   // Act
    //   spectator.service.setTitle();
    //   // Assert
    //   // expect(onLangChangeSpy).toHaveBeenCalledWith("title");
    // });
  });

  describe("on  destroy", () => {
    it("should clean up", () => {
      // Arrange
      spectator.service.init(defaultLanguage, supportedLanguages);

      // Act
      spectator.service.destroy();
      // Assert
      expect(spectator.service.langChangeSubscription.closed).toBe(true);
    });

    it("should clean up and not throw error if called twice", () => {
      // Arrange
      spectator.service.init(defaultLanguage, supportedLanguages);
      // Act
      spectator.service.destroy();
      spectator.service.destroy();
      // Assert
      expect(spectator.service.langChangeSubscription.closed).toBe(true);
    });
  });
});

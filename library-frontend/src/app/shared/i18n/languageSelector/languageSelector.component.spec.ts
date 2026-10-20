import { ApplicationRef } from "@angular/core";
import { provideRouter } from "@angular/router";
import { Logger } from "@app/services/logger.service";
import { I18nService } from "@app/shared/i18n/i18n.service";
import { LanguageSelectorComponent } from "@app/shared/i18n/languageSelector/languageSelector.component";
import { provideTranslateService, TranslateService } from "@ngx-translate/core";
import { createComponentFactory, Spectator } from "@openng/spectator/vitest";

Logger.level = 0;

// I18nService starts in the saved language, or pt-BR (cleared before each
// test)
describe("LanguageSelectorComponent", () => {
  let spectator: Spectator<LanguageSelectorComponent>;
  const createComponent = createComponentFactory({
    component: LanguageSelectorComponent,
    providers: [provideTranslateService(), provideRouter([])],
    detectChanges: false,
  });

  beforeEach(() => {
    localStorage.removeItem("language");
    spectator = createComponent();
    spectator.detectChanges();
  });

  // The menu lives in an overlay, outside the fixture's view
  function openMenu() {
    spectator.click("button[name='language']");
    spectator.inject(ApplicationRef).tick();
  }

  const options = () =>
    spectator.queryAll<HTMLButtonElement>("button[name='languageOption']", {
      root: true,
    });

  it("Should show the current language on the button", () => {
    // Assert
    const button = spectator.query("button[name='language']");
    expect(button).toContainText("PT");
    expect(button).toHaveAttribute("aria-label", "Idioma: Português");
  });

  it("Should list each language in its own language, marking the current one", () => {
    // Act
    openMenu();
    // Assert
    expect(
      options().map((option) => option.textContent?.replace(/\s+/g, " ").trim())
    ).toEqual(["check Português", "English"]);
    expect(options()[0]).toHaveAttribute("aria-current", "true");
    expect(options()[1]).not.toHaveAttribute("aria-current");
    expect(options()[1]).toHaveAttribute("lang", "en-US");
  });

  it("Should switch the language", () => {
    // Arrange
    const setLanguageSpy = vi.spyOn(
      spectator.inject(I18nService),
      "setLanguage"
    );
    openMenu();
    // Act
    spectator.click(options()[1]);
    spectator.detectChanges();
    // Assert
    expect(setLanguageSpy).toHaveBeenCalledWith("en-US");
    expect(spectator.inject(TranslateService).getCurrentLang()).toBe("en-US");
    expect(spectator.query("button[name='language']")).toContainText("EN");
  });

  it("Should fall back to the code for an unknown language", () => {
    // Assert
    expect(spectator.component.languageName("eo")).toBe("eo");
    expect(spectator.component.languageName(undefined)).toBe("");
    expect(spectator.component.shortName(undefined)).toBe("");
  });
});

import { RouterModule } from "@angular/router";
import { Logger } from "@app/services/logger.service";
import { I18nService } from "@app/shared/i18n/i18n.service";
import { LanguageSelectorComponent } from "@app/shared/i18n/language-selector/language-selector.component";
import { LanguagesEnum } from "@app/shared/i18n/translations/allTranslations";
import { createComponentFactory, Spectator } from "@ngneat/spectator/vitest";
import { TranslateModule } from "@ngx-translate/core";

Logger.level = 0;

describe("LanguageSelectorComponent", () => {
  let spectator: Spectator<LanguageSelectorComponent>;
  const createComponent = createComponentFactory({
    component: LanguageSelectorComponent,
    imports: [RouterModule.forRoot([]), TranslateModule.forRoot()],
    providers: [I18nService],
  });

  beforeEach(() => (spectator = createComponent()));

  it("should create", () => {
    expect(spectator.query("div")).toBeTruthy();
  });

  it("dropdown should be closed", () => {
    expect(spectator.component.isDropdownOpen.getValue()).toBe(false);
  });

  it("should open dropdown", () => {
    spectator.component.toggleDropdown();
    spectator.detectChanges();
    expect(spectator.component.isDropdownOpen.getValue()).toBe(true);
    const dropdown = spectator.query(".open");
    expect(dropdown).toBeTruthy();
    expect(dropdown?.textContent).toContain(LanguagesEnum.PT_BR);
    expect(dropdown?.textContent).toContain(LanguagesEnum.EN_US);
  });

  it("should close dropdown", () => {
    spectator.component.toggleDropdown();
    spectator.detectChanges();
    expect(spectator.component.isDropdownOpen.getValue()).toBe(true);
    spectator.component.toggleDropdown();
    spectator.detectChanges();
    expect(spectator.component.isDropdownOpen.getValue()).toBe(false);
  });

  it("should close dropdown on clicking outside", () => {
    spectator.component.toggleDropdown();
    spectator.detectChanges();
    expect(spectator.component.isDropdownOpen.getValue()).toBe(true);
    spectator.element?.parentElement?.click();
    spectator.detectChanges();
    expect(spectator.component.isDropdownOpen.getValue()).toBe(false);
  });

  it("should not close with click inside", () => {
    // Arrange
    spectator.component.toggleDropdown();
    spectator.detectChanges();
    // Act
    spectator.click("div");
    spectator.detectChanges();
    // Assert
    expect(spectator.component.isDropdownOpen.getValue()).toBe(true);
  });

  it("should set language with click", () => {
    spectator.component.toggleDropdown();
    spectator.detectChanges();
    spectator.queryAll("li")[1].dispatchEvent(new Event("click"));
    spectator.detectChanges();
    expect(spectator.component.currentLanguage).toBe("US");
  });

  it("should set language with keyup", () => {
    spectator.component.toggleDropdown();
    spectator.detectChanges();
    spectator
      .queryLast("li")
      ?.dispatchEvent(new KeyboardEvent("keyup", { key: "Enter" }));
    spectator.detectChanges();
    expect(spectator.component.currentLanguage).toBe("US");
  });

  it("Should process empty language", () => {
    spectator.component.setLanguage("");
    expect(spectator.component.getLanguageCode("")).toBe("");
  });

  it("main div keyup", () => {
    spectator
      .query("div")
      ?.dispatchEvent(new KeyboardEvent("keyup", { key: "Enter" }));

    spectator.detectChanges();
    expect(spectator.component.isDropdownOpen.getValue()).toBe(false);
  });

  it("second div keyup with enter - should open", () => {
    spectator
      .query(".dropdown-toggle")
      ?.dispatchEvent(new KeyboardEvent("keyup", { key: "Enter" }));

    spectator.detectChanges();
    expect(spectator.component.isDropdownOpen.getValue()).toBe(true);
  });

  it("second div click - should open", () => {
    spectator.click(".dropdown-toggle");
    spectator.detectChanges();
    expect(spectator.component.isDropdownOpen.getValue()).toBe(true);
  });

  it("should show empty dropdown", () => {
    // Arrange
    const i18nService = spectator.inject(I18nService);
    i18nService.supportedLanguages.next([]);
    // Act
    spectator.component.toggleDropdown();
    spectator.detectChanges();
    // Assert
    expect(spectator.queryAll("li").length).toBe(1);
    expect(spectator.queryAll("li")[0].textContent).toBe("There are no items.");
  });

  it("Test onClickOutside with no nativeElement", () => {
    // Arrange
    const elementRef = spectator.debugElement;
    vi.spyOn(elementRef, "nativeElement", "get").mockReturnValue(null);
    // Act
    spectator.component.onClickOutside(new Event("click"));
    // Assert
    expect(spectator.component.isDropdownOpen.getValue()).toBe(false);
  });
});

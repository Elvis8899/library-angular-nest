import { ElementRef } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { Logger } from "@app/services/logger.service";
import { I18nService } from "@app/shared/i18n/i18n.service";
import { LanguageSelectorComponent } from "@app/shared/i18n/language-selector/language-selector.component";
import { LanguagesEnum } from "@app/shared/i18n/translations/allTranslations";
import { TranslateModule } from "@ngx-translate/core";
import { vi } from "vitest";

Logger.level = 0;

describe("LanguageSelectorComponent", () => {
  let component: LanguageSelectorComponent;
  let fixture: ComponentFixture<LanguageSelectorComponent>;
  let compiled: HTMLElement;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot(), LanguageSelectorComponent],
      providers: [I18nService],
    }).compileComponents();
    fixture = TestBed.createComponent(LanguageSelectorComponent);
    component = fixture.componentInstance;
    compiled = fixture.nativeElement as HTMLElement;
  });

  it("should create", () => {
    expect(fixture).toBeTruthy();
    expect(component).toBeTruthy();
    expect(compiled).toBeTruthy();
  });

  it("dropdown should be closed", () => {
    expect(component.isDropdownOpen).toBe(false);
  });

  it("should open dropdown", () => {
    component.toggleDropdown();
    fixture.detectChanges();
    expect(component.isDropdownOpen).toBe(true);
    const dropdown = compiled.querySelector(".open");
    expect(dropdown).toBeTruthy();
    expect(dropdown?.textContent).toContain(LanguagesEnum.PT_BR);
    expect(dropdown?.textContent).toContain(LanguagesEnum.EN_US);

    //console.log(fixture., compiled);
    //expect(compiled.querySelector(".open")).toBe();
  });

  it("should close dropdown", () => {
    component.toggleDropdown();
    fixture.detectChanges();
    expect(component.isDropdownOpen).toBe(true);
    component.toggleDropdown();
    fixture.detectChanges();
    expect(component.isDropdownOpen).toBe(false);
  });

  it("should close dropdown on clicking outside", () => {
    component.toggleDropdown();
    fixture.detectChanges();
    expect(component.isDropdownOpen).toBe(true);
    compiled.parentElement?.click();
    fixture.detectChanges();
    expect(component.isDropdownOpen).toBe(false);
  });

  it("should set language with click", () => {
    component.toggleDropdown();
    fixture.detectChanges();
    compiled.querySelectorAll("li")[1].click();
    fixture.detectChanges();
    expect(component.currentLanguage).toBe("US");
  });

  it("should set language with keyup", () => {
    component.toggleDropdown();
    fixture.detectChanges();
    // compiled
    //   .querySelectorAll("li")[1]
    //   .dispatchEvent(new KeyboardEvent("keyup", { key: "Enter" }));
    fixture.debugElement
      .queryAll(By.css("li"))[1]
      .triggerEventHandler("keyup", {
        key: "Enter",
      });
    fixture.detectChanges();
    expect(component.currentLanguage).toBe("US");
  });

  it("Should process empty language", () => {
    component.setLanguage("");
    expect(component.getLanguageCode("")).toBe("");
  });

  it("main div keyup", () => {
    fixture.debugElement
      .query(By.css("div"))
      .triggerEventHandler(
        "keyup",
        new KeyboardEvent("keyup", { key: "Enter" })
      );

    fixture.detectChanges();
    expect(component.isDropdownOpen).toBe(false);
  });
  it("second div keyup with enter - should open", () => {
    compiled
      .querySelectorAll("div")[1]
      .dispatchEvent(new KeyboardEvent("keyup", { key: "Enter" }));

    fixture.detectChanges();
    expect(component.isDropdownOpen).toBe(true);
  });
  it("second div click - should open", () => {
    compiled.querySelectorAll("div")[1].click();
    fixture.detectChanges();
    expect(component.isDropdownOpen).toBe(true);
  });

  it("should show empty dropdown", () => {
    const i18nService = fixture.debugElement.injector.get(I18nService);
    i18nService.supportedLanguages = [];
    component.toggleDropdown();
    fixture.detectChanges();
    expect(compiled.querySelectorAll("li").length).toBe(1);
    expect(compiled.querySelectorAll("li")[0].textContent).toBe(
      "There are no items."
    );
  });

  it("Test onClickOutside with no nativeElement", () => {
    const elementRef = fixture.debugElement.injector.get(ElementRef);
    vi.spyOn(elementRef, "nativeElement", "get").mockReturnValue(null);
    component.onClickOutside(new Event("click"));
    expect(component.isDropdownOpen).toBe(false);
  });
});

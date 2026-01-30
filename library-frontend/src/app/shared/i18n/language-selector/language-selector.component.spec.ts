import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Logger } from "@app/services/logger.service";
import { I18nService } from "@app/shared/i18n/i18n.service";
import { LanguageSelectorComponent } from "@app/shared/i18n/language-selector/language-selector.component";
import { LanguagesEnum } from "@app/shared/i18n/translations/allTranslations";
import { TranslateModule } from "@ngx-translate/core";

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
    fixture.detectChanges();
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
    compiled
      .querySelectorAll("li")[1]
      .dispatchEvent(new KeyboardEvent("keyup", { key: "Enter" }));
    fixture.detectChanges();
    expect(component.currentLanguage).toBe("US");
  });

  it("Should process empty language", () => {
    component.setLanguage("");
    expect(component.getLanguageCode("")).toBe("");
  });
});

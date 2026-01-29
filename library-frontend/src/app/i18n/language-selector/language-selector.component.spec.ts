import { ComponentFixture, TestBed } from "@angular/core/testing";
import { I18nService } from "@app/i18n/i18n.service";
import { LanguageSelectorComponent } from "@app/i18n/language-selector/language-selector.component";
import { TranslateModule } from "@ngx-translate/core";

describe("LanguageSelectorComponent", () => {
  let component: LanguageSelectorComponent;
  let fixture: ComponentFixture<LanguageSelectorComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot(), LanguageSelectorComponent],
      providers: [I18nService],
    }).compileComponents();
    fixture = TestBed.createComponent(LanguageSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});

import { formatCurrency, formatDate } from "@angular/common";
import { TestBed } from "@angular/core/testing";
import { injectCurrentLocale } from "@app/shared/i18n/currentLocale";
import { TranslateModule, TranslateService } from "@ngx-translate/core";

describe("injectCurrentLocale", () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [TranslateModule.forRoot()] });
  });

  it("Should be undefined until a language is set, then follow it", () => {
    // Arrange
    const locale = TestBed.runInInjectionContext(injectCurrentLocale);
    // Assert
    expect(locale()).toBeUndefined();
    // Act
    TestBed.inject(TranslateService).use("en-US");
    // Assert
    expect(locale()).toBe("en-US");
  });

  it("Should start with the current language", () => {
    // Arrange
    TestBed.inject(TranslateService).use("pt-BR");
    // Act
    const locale = TestBed.runInInjectionContext(injectCurrentLocale);
    // Assert
    expect(locale()).toBe("pt-BR");
  });

  it("Should register the pt-BR formats", () => {
    // Assert
    // The currency has a no-break space after the symbol
    expect(formatCurrency(39.9, "pt-BR", "R$", "BRL")).toBe("R$\u00a039,90");
    expect(formatDate("2026-10-20T12:00:00", "shortDate", "pt-BR")).toBe(
      "20/10/2026"
    );
  });
});

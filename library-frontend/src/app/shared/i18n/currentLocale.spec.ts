import { formatCurrency, formatDate } from "@angular/common";
import { injectCurrentLocale } from "@app/shared/i18n/currentLocale";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import {
  createInjectionContextFactory,
  SpectatorInjectionContext,
} from "@openng/spectator/vitest";

describe("injectCurrentLocale", () => {
  let spectator: SpectatorInjectionContext;
  const createInjectionContext = createInjectionContextFactory({
    imports: [TranslateModule.forRoot()],
  });

  beforeEach(() => (spectator = createInjectionContext()));

  it("Should be undefined until a language is set, then follow it", () => {
    // Arrange
    const locale = spectator.runInInjectionContext(injectCurrentLocale);
    // Assert
    expect(locale()).toBeUndefined();
    // Act
    spectator.inject(TranslateService).use("en-US");
    // Assert
    expect(locale()).toBe("en-US");
  });

  it("Should start with the current language", () => {
    // Arrange
    spectator.inject(TranslateService).use("pt-BR");
    // Act
    const locale = spectator.runInInjectionContext(injectCurrentLocale);
    // Assert
    expect(locale()).toBe("pt-BR");
  });

  it("Should register the pt-BR formats", () => {
    // Assert: the currency has a no-break space after the symbol
    expect(formatCurrency(39.9, "pt-BR", "R$", "BRL")).toBe("R$\u00a039,90");
    expect(formatDate("2026-10-20T12:00:00", "shortDate", "pt-BR")).toBe(
      "20/10/2026"
    );
  });
});

import { MoneyPipe, QtyPipe } from "@app/shared/pipes/number.pipes";
import { provideTranslateService, TranslateService } from "@ngx-translate/core";
import { createPipeFactory, SpectatorPipe } from "@openng/spectator/vitest";

describe("Number pipes", () => {
  let spectator: SpectatorPipe<MoneyPipe>;
  const createPipe = createPipeFactory({
    pipe: MoneyPipe,
    imports: [QtyPipe],
    providers: [provideTranslateService()],
  });
  const text = () => spectator.element.textContent?.trim();

  it("Should format before a language is set", () => {
    // Act
    spectator = createPipe(`{{ 1234.5 | money }}`);
    // Assert: the default locale's
    expect(text()).toBe("R$1,234.50");
  });

  it("Should format in the screen's language, and follow a change", () => {
    // Arrange
    spectator = createPipe(`{{ 1234.5 | money }} · {{ 1234.5 | qty }}`);
    spectator.inject(TranslateService).use("pt-BR");
    spectator.detectChanges();
    // Assert: Intl puts a no-break space after the symbol
    expect(text()).toBe("R$\u00a01.234,50 · 1.234,5");
    // Act
    spectator.inject(TranslateService).use("en-US");
    spectator.detectChanges();
    // Assert
    expect(text()).toBe("R$1,234.50 · 1,234.5");
  });
});

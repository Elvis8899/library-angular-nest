import { signal } from "@angular/core";
import { RouterModule } from "@angular/router";
import { HeaderComponent } from "@app/layouts/components/header/header.component";
import { Logger } from "@app/services/logger.service";
import { ColorScheme, ThemeService } from "@app/services/theme.service";
import { createComponentFactory, Spectator } from "@ngneat/spectator/vitest";
import { TranslateModule } from "@ngx-translate/core";

Logger.level = 0;

// The language selector loads pt-BR, the default language
describe("HeaderComponent", () => {
  let spectator: Spectator<HeaderComponent>;
  const colorScheme = signal<ColorScheme>("light");
  const themeServiceMock = {
    colorScheme,
    toggle: vi.fn(() =>
      colorScheme.set(colorScheme() === "dark" ? "light" : "dark")
    ),
  };
  const createComponent = createComponentFactory({
    component: HeaderComponent,
    imports: [RouterModule.forRoot([]), TranslateModule.forRoot()],
    providers: [{ provide: ThemeService, useValue: themeServiceMock }],
  });

  beforeEach(() => {
    colorScheme.set("light");
    themeServiceMock.toggle.mockClear();
    spectator = createComponent();
  });

  it("Should offer the dark theme in the light scheme", () => {
    // Assert
    expect(spectator.query("button[name='toggleTheme']")).toHaveAttribute(
      "aria-label",
      "Tema escuro"
    );
    expect(spectator.query("mat-icon")).toHaveText("dark_mode");
  });

  it("Should toggle the scheme on click", () => {
    // Act
    spectator.click("button[name='toggleTheme']");
    // Assert
    expect(themeServiceMock.toggle).toHaveBeenCalledTimes(1);
    expect(spectator.query("button[name='toggleTheme']")).toHaveAttribute(
      "aria-label",
      "Tema claro"
    );
    expect(spectator.query("mat-icon")).toHaveText("light_mode");
  });
});

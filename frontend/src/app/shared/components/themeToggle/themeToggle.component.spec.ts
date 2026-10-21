import { signal } from "@angular/core";
import { ColorScheme, ThemeService } from "@app/services/theme.service";
import { ThemeToggleComponent } from "@app/shared/components/themeToggle/themeToggle.component";
import { provideTranslateService } from "@ngx-translate/core";
import { createComponentFactory, Spectator } from "@openng/spectator/vitest";

describe("ThemeToggleComponent", () => {
  let spectator: Spectator<ThemeToggleComponent>;
  const colorScheme = signal<ColorScheme>("light");
  const themeServiceMock = {
    colorScheme,
    toggle: vi.fn(() =>
      colorScheme.set(colorScheme() === "dark" ? "light" : "dark")
    ),
  };
  const createComponent = createComponentFactory({
    component: ThemeToggleComponent,
    providers: [
      provideTranslateService(),
      { provide: ThemeService, useValue: themeServiceMock },
    ],
  });

  beforeEach(() => {
    colorScheme.set("light");
    themeServiceMock.toggle.mockClear();
    spectator = createComponent();
  });

  it("Should offer the dark theme in the light scheme", () => {
    // Assert
    expect(spectator.query("button")).toHaveAttribute(
      "aria-label",
      "theme.dark"
    );
    expect(spectator.query("mat-icon")).toHaveText("dark_mode");
  });

  it("Should toggle the scheme on click", () => {
    // Act
    spectator.click("button");
    // Assert
    expect(themeServiceMock.toggle).toHaveBeenCalledTimes(1);
    expect(spectator.query("button")).toHaveAttribute(
      "aria-label",
      "theme.light"
    );
    expect(spectator.query("mat-icon")).toHaveText("light_mode");
  });
});

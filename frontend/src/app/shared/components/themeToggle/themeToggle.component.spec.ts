import { ApplicationRef, signal } from "@angular/core";
import { ThemePreference, ThemeService } from "@app/services/theme.service";
import { ThemeToggleComponent } from "@app/shared/components/themeToggle/themeToggle.component";
import { provideTranslateService } from "@ngx-translate/core";
import { createComponentFactory, Spectator } from "@openng/spectator/vitest";

describe("ThemeToggleComponent", () => {
  let spectator: Spectator<ThemeToggleComponent>;
  const preference = signal<ThemePreference>("auto");
  const themeServiceMock = {
    preference,
    setPreference: vi.fn((value: ThemePreference) => preference.set(value)),
  };
  const createComponent = createComponentFactory({
    component: ThemeToggleComponent,
    providers: [
      provideTranslateService(),
      { provide: ThemeService, useValue: themeServiceMock },
    ],
  });

  beforeEach(() => {
    preference.set("auto");
    themeServiceMock.setPreference.mockClear();
    spectator = createComponent();
  });

  const openMenu = () => {
    spectator.click("button[name='toggleTheme']");
    spectator.inject(ApplicationRef).tick();
  };

  it("Should show the current choice's icon", () => {
    // Assert
    expect(spectator.query("mat-icon")).toHaveText("brightness_auto");
  });

  it("Should offer Automático, Claro and Escuro, the current one checked", () => {
    // Act
    openMenu();
    // Assert
    const items = spectator.queryAll("[mat-menu-item]", { root: true });
    expect(items.map((item) => item.getAttribute("name"))).toEqual([
      "theme-auto",
      "theme-light",
      "theme-dark",
    ]);
    expect(items[0]).toHaveAttribute("aria-checked", "true");
    expect(items[2]).toHaveAttribute("aria-checked", "false");
  });

  it("Should set the picked choice", () => {
    // Arrange
    openMenu();
    // Act
    spectator.click(
      spectator.query("button[name='theme-dark']", { root: true })!,
    );
    spectator.detectChanges();
    // Assert
    expect(themeServiceMock.setPreference).toHaveBeenCalledWith("dark");
    expect(spectator.query("button[name='toggleTheme'] mat-icon")).toHaveText(
      "dark_mode",
    );
  });
});

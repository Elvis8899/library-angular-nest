import { DOCUMENT } from "@angular/common";
import { ThemeService } from "@app/services/theme.service";
import { blockStorage } from "@app/shared/utils/test/storage";
import {
  createServiceFactory,
  SpectatorService,
} from "@openng/spectator/vitest";

describe("ThemeService", () => {
  let spectator: SpectatorService<ThemeService>;
  let systemDark: boolean;
  let onSystemChange: (() => void) | undefined;
  const html = document.documentElement;

  const createService = createServiceFactory({
    service: ThemeService,
    providers: [
      {
        provide: DOCUMENT,
        useFactory: () => ({
          documentElement: html,
          defaultView: {
            matchMedia: () => ({
              get matches() {
                return systemDark;
              },
              addEventListener: (_: string, listener: () => void) =>
                (onSystemChange = listener),
            }),
          },
        }),
      },
    ],
  });

  beforeEach(() => {
    localStorage.clear();
    html.style.colorScheme = "";
    systemDark = false;
    onSystemChange = undefined;
  });

  afterEach(() => vi.unstubAllGlobals());

  it("Should follow the system without a stored choice", () => {
    // Arrange
    systemDark = true;
    // Act
    spectator = createService();
    // Assert
    expect(spectator.service.preference()).toBe("auto");
    expect(spectator.service.colorScheme()).toBe("dark");
    expect(html.style.colorScheme).toBe("");
  });

  it("Should follow system changes without a stored choice", () => {
    // Arrange
    spectator = createService();
    // Act
    systemDark = true;
    onSystemChange?.();
    // Assert
    expect(spectator.service.colorScheme()).toBe("dark");
  });

  it("Should apply the stored choice", () => {
    // Arrange
    localStorage.setItem("colorScheme", "dark");
    // Act
    spectator = createService();
    // Assert
    expect(spectator.service.preference()).toBe("dark");
    expect(spectator.service.colorScheme()).toBe("dark");
    expect(html.style.colorScheme).toBe("dark");
  });

  it("Should ignore an invalid stored value", () => {
    // Arrange
    localStorage.setItem("colorScheme", "blue");
    // Act
    spectator = createService();
    // Assert
    expect(spectator.service.preference()).toBe("auto");
    expect(spectator.service.colorScheme()).toBe("light");
  });

  it("Should apply and remember a fixed scheme", () => {
    // Arrange
    spectator = createService();
    // Act
    spectator.service.setPreference("dark");
    // Assert
    expect(spectator.service.colorScheme()).toBe("dark");
    expect(html.style.colorScheme).toBe("dark");
    expect(localStorage.getItem("colorScheme")).toBe("dark");
  });

  it("Should go back to the system's scheme on Automático", () => {
    // Arrange
    systemDark = true;
    localStorage.setItem("colorScheme", "light");
    spectator = createService();
    // Act
    spectator.service.setPreference("auto");
    // Assert
    expect(spectator.service.colorScheme()).toBe("dark");
    expect(html.style.colorScheme).toBe("");
    expect(localStorage.getItem("colorScheme")).toBeNull();
  });

  it("Should keep a fixed scheme when the system changes", () => {
    // Arrange
    spectator = createService();
    spectator.service.setPreference("light");
    // Act
    systemDark = true;
    onSystemChange?.();
    // Assert
    expect(spectator.service.colorScheme()).toBe("light");
  });

  it("Should still apply the choice when storage is blocked", () => {
    // Arrange
    spectator = createService();
    blockStorage();
    // Act
    spectator.service.setPreference("dark");
    // Assert
    expect(spectator.service.colorScheme()).toBe("dark");
  });

  it("Should treat unreadable storage as no choice", () => {
    // Arrange
    blockStorage();
    // Act
    spectator = createService();
    // Assert
    expect(spectator.service.preference()).toBe("auto");
  });
});

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
    expect(spectator.service.colorScheme()).toBe("dark");
    expect(html.style.colorScheme).toBe("dark");
  });

  it("Should ignore an invalid stored value", () => {
    // Arrange
    localStorage.setItem("colorScheme", "blue");
    // Act
    spectator = createService();
    // Assert
    expect(spectator.service.colorScheme()).toBe("light");
  });

  it("Should toggle, apply and remember the choice", () => {
    // Arrange
    spectator = createService();
    // Act
    spectator.service.toggle();
    // Assert
    expect(spectator.service.colorScheme()).toBe("dark");
    expect(html.style.colorScheme).toBe("dark");
    expect(localStorage.getItem("colorScheme")).toBe("dark");
    // Act
    spectator.service.toggle();
    // Assert
    expect(spectator.service.colorScheme()).toBe("light");
  });

  it("Should keep the stored choice when the system changes", () => {
    // Arrange
    spectator = createService();
    spectator.service.toggle();
    // Act
    systemDark = false;
    onSystemChange?.();
    // Assert
    expect(spectator.service.colorScheme()).toBe("dark");
  });

  it("Should still toggle when storage is blocked", () => {
    // Arrange
    spectator = createService();
    blockStorage();
    // Act
    spectator.service.toggle();
    // Assert
    expect(spectator.service.colorScheme()).toBe("dark");
  });

  it("Should treat unreadable storage as no choice", () => {
    // Arrange
    blockStorage();
    // Act
    spectator = createService();
    // Assert
    expect(spectator.service.colorScheme()).toBe("light");
  });
});

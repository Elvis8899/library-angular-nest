import { provideRouter, Router } from "@angular/router";
import { HeaderComponent } from "@app/layouts/components/header/header.component";
import { LayoutComponent } from "@app/layouts/layout.component";
import { CredentialsService } from "@app/services/credentials.service";
import { Logger } from "@app/services/logger.service";
import { MockComponent } from "@app/shared/utils/test/mockComponent";
import { provideTranslateService } from "@ngx-translate/core";
import { createComponentFactory, Spectator } from "@openng/spectator/vitest";

Logger.level = 0;

describe("LayoutComponent", () => {
  let spectator: Spectator<LayoutComponent>;
  const createComponent = createComponentFactory({
    component: LayoutComponent,
    providers: [
      provideTranslateService(),
      provideRouter([{ path: "users", component: MockComponent }]),
      {
        provide: CredentialsService,
        useValue: {
          credentials: { user: { name: "Ana" } },
          isAdmin: () => false,
          hasRole: () => true,
        },
      },
    ],
  });

  beforeEach(() => (spectator = createComponent()));

  const shell = () => spectator.query(".shell");

  it("Should start with the menu closed", () => {
    // Assert
    expect(shell()).not.toHaveClass("menu-open");
    expect(spectator.query(".scrim")).toBeNull();
  });

  it("Should open and close the menu from the header", () => {
    // Act
    spectator.click("button[name='toggleMenu']");
    // Assert
    expect(shell()).toHaveClass("menu-open");
    expect(spectator.query(HeaderComponent)?.menuOpen()).toBe(true);
    // Act
    spectator.click("button[name='toggleMenu']");
    // Assert
    expect(shell()).not.toHaveClass("menu-open");
  });

  it("Should close the menu on the backdrop", () => {
    // Arrange
    spectator.component.toggleMenu();
    spectator.detectChanges();
    // Act
    spectator.click(".scrim");
    // Assert
    expect(shell()).not.toHaveClass("menu-open");
  });

  it("Should close the menu on Escape", () => {
    // Arrange
    spectator.component.toggleMenu();
    spectator.detectChanges();
    // Act
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    spectator.detectChanges();
    // Assert
    expect(shell()).not.toHaveClass("menu-open");
  });

  it("Should close the menu when a page opens", async () => {
    // Arrange
    spectator.component.toggleMenu();
    // Act
    await spectator.inject(Router).navigate(["/users"]);
    spectator.detectChanges();
    // Assert
    expect(shell()).not.toHaveClass("menu-open");
  });
});

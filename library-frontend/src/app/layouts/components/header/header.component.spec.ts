import { RouterModule } from "@angular/router";
import { HeaderComponent } from "@app/layouts/components/header/header.component";
import { CredentialsService } from "@app/services/credentials.service";
import { Logger } from "@app/services/logger.service";
import { provideTranslateService } from "@ngx-translate/core";
import { createComponentFactory, Spectator } from "@openng/spectator/vitest";

Logger.level = 0;

// The language selector loads the default language, pt-BR, unless another
// spec left a language in localStorage (cleared before each test)
describe("HeaderComponent", () => {
  let spectator: Spectator<HeaderComponent>;
  let name: string | undefined;
  let admin: boolean;
  const credentialsServiceMock = {
    get credentials() {
      return name === undefined ? null : { user: { name } };
    },
    isAdmin: () => admin,
  };
  const createComponent = createComponentFactory({
    component: HeaderComponent,
    imports: [RouterModule.forRoot([])],
    providers: [
      provideTranslateService(),
      { provide: CredentialsService, useValue: credentialsServiceMock },
    ],
    detectChanges: false,
  });

  function create(userName: string | undefined, isAdmin: boolean) {
    localStorage.removeItem("language");
    name = userName;
    admin = isAdmin;
    spectator = createComponent();
    spectator.detectChanges();
  }

  it("Should show the user's name, initials and role", () => {
    // Act
    create("Ana Maria Souza", false);
    // Assert
    expect(spectator.query(".user-name")).toHaveText("Ana Maria Souza");
    expect(spectator.query(".avatar")).toHaveText("AS");
    expect(spectator.query(".user-role")).toHaveText("Cliente");
  });

  it("Should show an admin with a one-word name", () => {
    // Act
    create("admin", true);
    // Assert
    expect(spectator.query(".avatar")).toHaveText("A");
    expect(spectator.query(".user-role")).toHaveText("Administrador");
  });

  it("Should show nothing without credentials", () => {
    // Act
    create(undefined, false);
    // Assert
    expect(spectator.query(".user-name")).toHaveText("");
    expect(spectator.query(".avatar")).toHaveText("");
  });

  it("Should ask to open and close the menu", () => {
    // Arrange
    create("Ana", false);
    const toggled = vi.fn();
    spectator.output("menuToggle").subscribe(toggled);
    const button = () => spectator.query("button[name='toggleMenu']");
    // Assert
    expect(button()).toHaveAttribute("aria-expanded", "false");
    expect(button()).toHaveAttribute("aria-label", "Abrir menu");
    // Act
    spectator.click("button[name='toggleMenu']");
    // Assert
    expect(toggled).toHaveBeenCalledTimes(1);
    // Act: the layout opens it
    spectator.setInput("menuOpen", true);
    // Assert
    expect(button()).toHaveAttribute("aria-expanded", "true");
    expect(button()).toHaveAttribute("aria-label", "Fechar menu");
    expect(button()?.querySelector("mat-icon")).toHaveText("close");
  });

  it("Should show the theme toggle and the language selector", () => {
    // Act
    create("Ana", false);
    // Assert
    expect(spectator.query("app-theme-toggle")).toBeTruthy();
    expect(spectator.query("app-language-selector")).toBeTruthy();
  });
});

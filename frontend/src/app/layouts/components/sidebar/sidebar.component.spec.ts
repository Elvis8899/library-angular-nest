import { provideRouter, Router } from "@angular/router";
import { sidebarMenuItems } from "@app/layouts/components/sidebar/navMenuItems";
import { SidebarComponent } from "@app/layouts/components/sidebar/sidebar.component";
import { ROLE } from "@app/models/credentials.entity";
import { CredentialsService } from "@app/services/credentials.service";
import { ptBR } from "@app/shared/i18n/translations/pt-BR";
import { MockComponent } from "@app/shared/utils/test/mockComponent";
import { provideTranslateService, TranslateService } from "@ngx-translate/core";
import { createComponentFactory, Spectator } from "@openng/spectator/vitest";

describe("SidebarComponent", () => {
  let spectator: Spectator<SidebarComponent>;
  let role: ROLE;

  const credentialsServiceMock = {
    hasRole: (roles: ROLE[]) => roles.includes(role),
  };

  const createComponent = createComponentFactory({
    component: SidebarComponent,
    providers: [
      provideTranslateService(),
      provideRouter([{ path: "users", component: MockComponent }]),
      { provide: CredentialsService, useValue: credentialsServiceMock },
    ],
  });

  const labels = () =>
    spectator.queryAll(".menu-label").map((label) => label.textContent?.trim());

  // The pages each role sees, in the menu's order
  const itemsFor = (forRole: ROLE) =>
    sidebarMenuItems.filter((item) => item.roles.includes(forRole));

  describe("As an admin", () => {
    beforeEach(() => {
      role = ROLE.ADMIN;
      spectator = createComponent();
    });

    it("Should list every page, with logout last", () => {
      expect(labels()).toEqual([
        ...itemsFor(ROLE.ADMIN).map((item) => item.title),
        "nav.logout",
      ]);
      expect(labels()[0]).toBe("nav.users");
    });

    it("Should link each item to its page", () => {
      const links = spectator
        .queryAll("a.menu-link")
        .map((link) => link.getAttribute("href"));

      expect(links).toEqual([
        ...itemsFor(ROLE.ADMIN).map((item) => item.route),
        "/logout",
      ]);
      expect(spectator.query("a.brand")).toHaveAttribute("href", "/");
    });

    it("Should highlight the current page, wherever navigation started", async () => {
      await spectator.inject(Router).navigate(["/users"]);
      await spectator.fixture.whenStable();

      const active = spectator.queryAll("a.menu-link.active");
      expect(active).toHaveLength(1);
      expect(active[0]).toHaveAttribute("href", "/users");
    });

    it("Should collapse and expand", () => {
      const nav = () => spectator.query("nav");
      const toggle = () => spectator.query("button.toggle");
      expect(nav()).not.toHaveClass("collapsed");
      expect(toggle()).toHaveAttribute("aria-expanded", "true");
      // Labels are visible, so links need no tooltip
      expect(spectator.query("a.menu-link")).not.toHaveAttribute("title");

      spectator.click("button.toggle");

      expect(nav()).toHaveClass("collapsed");
      expect(toggle()).toHaveAttribute("aria-expanded", "false");
      // Only icons are shown, so the title names the page
      expect(spectator.query("a.menu-link")).toHaveAttribute(
        "title",
        "nav.users"
      );

      spectator.click("button.toggle");

      expect(nav()).not.toHaveClass("collapsed");
    });

    it("Should show the labels in the current language", async () => {
      const translate = spectator.inject(TranslateService);
      translate.setTranslation("pt-BR", ptBR);
      translate.use("pt-BR");
      await spectator.fixture.whenStable();

      expect(labels()[0]).toBe("Usuários");
      expect(labels().at(-1)).toBe("Sair");
      expect(spectator.query(".brand-name")).toHaveText("Biblioteca");
      expect(spectator.query("button.toggle")).toHaveAttribute(
        "aria-label",
        "Mostrar ou esconder o menu"
      );
    });
  });

  describe("As a client", () => {
    beforeEach(() => {
      role = ROLE.CLIENT;
      spectator = createComponent();
    });

    it("Should hide the admin pages", () => {
      expect(labels()).toEqual([
        ...itemsFor(ROLE.CLIENT).map((item) => item.title),
        "nav.logout",
      ]);
      expect(labels()).not.toContain("nav.users");
    });
  });
});

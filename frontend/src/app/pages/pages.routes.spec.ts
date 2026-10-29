import { provideRouter, Router } from "@angular/router";
import { defaultRolePage } from "@app/layouts/components/sidebar/navMenuItems";
import { ROLE } from "@app/models/credentials.entity";
import { routes } from "@app/pages/pages.routes";
import { CredentialsService } from "@app/services/credentials.service";
import { Logger, LogLevel } from "@app/services/logger.service";
import { I18nService } from "@app/shared/i18n/i18n.service";
import {
  createServiceFactory,
  SpectatorService,
} from "@openng/spectator/vitest";

Logger.level = LogLevel.Off;

// No router outlet is rendered: guards and lazy loading run, but the pages
// themselves are never created
describe("Routes", () => {
  let role: ROLE | null;
  let spectator: SpectatorService<Router>;

  const credentialsServiceMock = {
    isAuthenticated: () => role !== null,
    getRole: () => role,
    hasRole: (required?: ROLE[]) =>
      !required?.length || (role !== null && required.includes(role)),
    hasPermission: () => true,
  };

  // Guards redirect by starting a new navigation, so wait for the last one
  const navigate = async (url: string) => {
    const router = spectator.service;
    await router.navigateByUrl(url);
    await vi.waitFor(() => expect(router.currentNavigation()).toBeNull());
    return router.url;
  };

  const i18nServiceMock = { loadPages: vi.fn(() => Promise.resolve()) };

  const createService = createServiceFactory({
    service: Router,
    providers: [
      provideRouter(routes),
      { provide: I18nService, useValue: i18nServiceMock },
      { provide: CredentialsService, useValue: credentialsServiceMock },
    ],
  });

  beforeEach(() => (spectator = createService()));

  describe("When logged out", () => {
    beforeEach(() => {
      role = null;
    });

    it("Should open the login page by default", async () => {
      expect(await navigate("/")).toBe("/login");
    });

    it("Should send protected pages to login and come back after", async () => {
      expect(await navigate("/users/list")).toBe(
        "/login?redirect=%2Fusers%2Flist",
      );
    });

    it("Should open the logout page", async () => {
      expect(await navigate("/logout")).toBe("/logout");
    });
  });

  describe("When logged in as a client", () => {
    beforeEach(() => {
      role = ROLE.CLIENT;
    });

    it("Should load the pages' texts with the layout", async () => {
      i18nServiceMock.loadPages.mockClear();
      await navigate(defaultRolePage(ROLE.CLIENT));
      expect(i18nServiceMock.loadPages).toHaveBeenCalled();
    });

    it("Should leave the login page for the client's default page", async () => {
      const defaultPage = await navigate(defaultRolePage(ROLE.CLIENT));
      expect(await navigate("/login")).toBe(defaultPage);
    });

    it("Should open the home page", async () => {
      expect(await navigate("/home")).toBe("/home");
    });

    it.each(["/users/list", "/users/add", "/audit", "/unknown"])(
      "Should send %s to the client's default page",
      async (url) => {
        const defaultPage = await navigate(defaultRolePage(ROLE.CLIENT));
        expect(await navigate(url)).toBe(defaultPage);
      },
    );

    // Lending example
    describe("With the lending example's pages", () => {
      it("Should land on the books", async () => {
        expect(await navigate("/login")).toBe("/books/list");
      });

      it.each(["/books/list", "/rentals/list"])(
        "Should open %s",
        async (url) => {
          expect(await navigate(url)).toBe(url);
        },
      );

      it.each([
        ["/books", "/books/list"],
        ["/rentals", "/rentals/list"],
        ["/books/add", "/books/list"],
      ])("Should redirect %s to %s", async (url, target) => {
        expect(await navigate(url)).toBe(target);
      });
    });
  });

  describe("When logged in as an admin", () => {
    beforeEach(() => {
      role = ROLE.ADMIN;
    });

    it("Should leave the login page for the admin's default page", async () => {
      expect(await navigate("/login")).toBe("/users/list");
    });

    it.each(["/users/list", "/users/add", "/audit", "/home"])(
      "Should open %s",
      async (url) => {
        expect(await navigate(url)).toBe(url);
      },
    );

    it.each([
      ["/users", "/users/list"],
      ["/unknown", "/users/list"],
    ])("Should redirect %s to %s", async (url, target) => {
      expect(await navigate(url)).toBe(target);
    });

    // Lending example
    it.each(["/books/list", "/books/add", "/rentals/list"])(
      "Should open the lending example's %s",
      async (url) => {
        expect(await navigate(url)).toBe(url);
      },
    );
  });
});

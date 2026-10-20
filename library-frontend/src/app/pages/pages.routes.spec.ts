import { provideRouter, Router } from "@angular/router";
import { ROLE } from "@app/models/credentials.entity";
import { routes } from "@app/pages/pages.routes";
import { CredentialsService } from "@app/services/credentials.service";
import { Logger } from "@app/services/logger.service";
import {
  createServiceFactory,
  SpectatorService,
} from "@ngneat/spectator/vitest";

Logger.level = 0;

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
    await vi.waitFor(() => expect(router.getCurrentNavigation()).toBeNull());
    return router.url;
  };

  const createService = createServiceFactory({
    service: Router,
    providers: [
      provideRouter(routes),
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
      expect(await navigate("/books/list")).toBe(
        "/login?redirect=%2Fbooks%2Flist"
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

    it("Should leave the login page for the client's default page", async () => {
      expect(await navigate("/login")).toBe("/books/list");
    });

    it.each(["/books/list", "/rentals/list"])("Should open %s", async (url) => {
      expect(await navigate(url)).toBe(url);
    });

    it.each([
      ["/books", "/books/list"],
      ["/rentals", "/rentals/list"],
      ["/unknown", "/books/list"],
    ])("Should redirect %s to %s", async (url, target) => {
      expect(await navigate(url)).toBe(target);
    });

    it.each(["/users/list", "/users/add", "/books/add"])(
      "Should not open the admin page %s",
      async (url) => {
        expect(await navigate(url)).toBe("/books/list");
      }
    );
  });

  describe("When logged in as an admin", () => {
    beforeEach(() => {
      role = ROLE.ADMIN;
    });

    it("Should leave the login page for the admin's default page", async () => {
      expect(await navigate("/login")).toBe("/users/list");
    });

    it.each(["/users/list", "/users/add", "/books/list", "/books/add"])(
      "Should open %s",
      async (url) => {
        expect(await navigate(url)).toBe(url);
      }
    );

    it("Should redirect /users to /users/list", async () => {
      expect(await navigate("/users")).toBe("/users/list");
    });
  });
});

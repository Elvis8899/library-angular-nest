import { ActivatedRouteSnapshot } from "@angular/router";
import { RouteReusableStrategy } from "@app/shared/helpers/route-reusable-strategy";
import {
  createServiceFactory,
  SpectatorService,
} from "@ngneat/spectator/vitest";

describe("RouteReuseStrategy", () => {
  let spectator: SpectatorService<RouteReusableStrategy>;
  const createContext = createServiceFactory({
    service: RouteReusableStrategy,
    mocks: [ActivatedRouteSnapshot],
  });

  beforeEach(() => {
    spectator = createContext();
  });

  describe("shouldReuseRoute", () => {
    it("should return true for same route", () => {
      // RouteReusableStrategy
      const route = spectator.inject(ActivatedRouteSnapshot);
      const res = spectator.service.shouldReuseRoute(route, route);

      expect(res).toBe(true);
    });

    it("should return false for different route", () => {
      // RouteReusableStrategy
      const route = spectator.inject(ActivatedRouteSnapshot);
      const route2 = { routeConfig: {} } as ActivatedRouteSnapshot;
      const res = spectator.service.shouldReuseRoute(route, route2);

      expect(res).toBe(false);
    });

    it("should return true for different routeConfig, but same component", () => {
      // RouteReusableStrategy
      const component = {};
      const route = { routeConfig: { component } } as ActivatedRouteSnapshot;
      const route2 = { routeConfig: { component } } as ActivatedRouteSnapshot;
      const res = spectator.service.shouldReuseRoute(route, route2);

      expect(res).toBe(true);
    });
  });

  describe("shouldDetach", () => {
    it("should return false ", () => {
      const res = spectator.service.shouldDetach();

      expect(res).toBe(false);
    });
  });
  describe("store", () => {
    it("should return undefined ", () => {
      const res = spectator.service.store();

      expect(res).toBe(undefined);
    });
  });

  describe("shouldAttach", () => {
    it("should return false ", () => {
      const res = spectator.service.shouldAttach();

      expect(res).toBe(false);
    });
  });

  describe("retrieve", () => {
    it("should return null ", () => {
      const res = spectator.service.retrieve();

      expect(res).toBe(null);
    });
  });
});

import { Injectable } from "@angular/core";
import {
  ActivatedRouteSnapshot,
  DetachedRouteHandle,
  RouteReuseStrategy,
} from "@angular/router";

/**
 * A route strategy allowing for explicit route reuse.
 * Used as a workaround for https://github.com/angular/angular/issues/18374
 * To reuse a given route, add `data: { reuse: true }` to the route definition.
 */
@Injectable()
export class RouteReusableStrategy extends RouteReuseStrategy {
  public shouldDetach(): boolean {
    return false;
  }

  public store(): void {
    //
  }

  public shouldAttach(): boolean {
    return false;
  }

  public retrieve(): DetachedRouteHandle | null {
    return null;
  }

  public shouldReuseRoute(
    future: ActivatedRouteSnapshot,
    curr: ActivatedRouteSnapshot
  ): boolean {
    // Reuse the route if the RouteConfig is the same, or if both routes use the
    // same component, because the latter can have different RouteConfigs.
    return (
      future.routeConfig === curr.routeConfig ||
      Boolean(
        future.routeConfig?.component &&
          future.routeConfig?.component === curr.routeConfig?.component
      )
    );
  }
}

import { inject } from "@angular/core";
import {
  ActivatedRouteSnapshot,
  CanActivateChildFn,
  CanActivateFn,
  Router,
} from "@angular/router";
import { PERMISSIONS, ROLE } from "@app/models/credentials.entity";
import { CredentialsService } from "@app/services/credentials.service";

/**
 * The `PermissionGuard` function checks for required roles and permissions before
 * allowing access to a route.
 * @param {ActivatedRouteSnapshot} route - The `route` parameter in the `PermissionGuard` function
 * represents the current route being activated. It is of type `ActivatedRouteSnapshot` which contains
 * information about the route, its parameters, data, and the URL segments. This parameter is used to
 * access route data such as roles and permissions specified for
 * @param {RouterStateSnapshot} state - The `state` parameter in the `PermissionGuard` function refers
 * to the current RouterStateSnapshot object. It represents the state of the router at a specific point
 * in time and contains information about the current route, URL, and any additional data associated
 * with the route. The `state` parameter is used
 * @returns The `PermissionGuard` function is returning a boolean value (`true`) if the user has the
 * required roles and permissions specified in the route data. If the user does not have the required
 * roles or permissions, the function will call the `handleUnauthorized` function and return the result
 * of that function, which is typically a redirect to an unauthorized page or action.
 */
export const permissionGuard: CanActivateFn & CanActivateChildFn = (
  route: ActivatedRouteSnapshot
) => {
  const credentialsService = inject(CredentialsService);
  const router = inject(Router);

  // Check if roles are specified in the route and validate them
  const requiredRoles = route.data?.["roles"] as ROLE[] | undefined;
  if (requiredRoles?.length && !credentialsService.hasRole(requiredRoles)) {
    return handleUnauthorized(router);
  }

  // Check permissions
  const requiredPermissions = route.data?.["permissions"] as
    | PERMISSIONS[]
    | undefined;
  if (!credentialsService.hasPermission(requiredPermissions)) {
    return handleUnauthorized(router);
  }
  return true;
};

// Utility function to handle unauthorized access
function handleUnauthorized(router: Router): boolean {
  router.navigate(["/unauthorized"]);
  return false;
}

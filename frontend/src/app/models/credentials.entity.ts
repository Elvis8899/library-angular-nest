import type { AuthResponse } from "@library/contracts";
import { UserRole } from "@library/contracts";
/** The API's roles, and the guest's: who isn't logged in. */
export const ROLE = {
  ADMIN: UserRole.Admin,
  CLIENT: UserRole.Client,
  GUEST: "guest",
} as const;
export type ROLE = (typeof ROLE)[keyof typeof ROLE];

/**
 * Enum for permissions
 * @readonly
 * @enum {string}
 *
 * @description The permissions enum is used to define the permissions in the application. it is derived from the role-based access control (RBAC) model and the
 * predefined role based permissions, which are defined in the `appSetting` object in the `@core/constants/app-settings` file.
 *
 * This permission enum can be used in routes, components, services, and directives to check if the user has the required permission to access the resource.
 *
 * The permission in this enum is derived as a combination of the action and the resource. For example, `CREATE_USER` means the user has permission to create a user.
 * which in `appSettings` is defined as `role: { [ROLE.ADMIN]: { [PERMISSIONS.CREATE_USER]: true } }`.
 *
 * @example
 * ```typescript
 * import { PERMISSIONS } from '@app/auth/enums/permissions.enum';
 *
 * if (this._permissionService.hasPermission(PERMISSIONS.CREATE_USER)) {
 *  // do something
 *  }
 */

export enum PERMISSIONS {
  CREATE_USER = "create.user",
  ACCESS_USER = "access.user",
}

/** The login's answer, as stored. */
export type Credentials = AuthResponse;

/**
 * The `appSetting` object contains the role-based permissions for the application.
 * The permission setup is based on the role-based access control (RBAC) model. In this model, permissions are assigned to roles, and roles are assigned to users.
 * For example, you can define the permissions in the following format:
 */
export const appPermissionsSetting: Record<
  ROLE,
  Record<PERMISSIONS, boolean>
> = {
  [ROLE.ADMIN]: {
    [PERMISSIONS.CREATE_USER]: true,
    [PERMISSIONS.ACCESS_USER]: true,
  },
  [ROLE.CLIENT]: {
    [PERMISSIONS.CREATE_USER]: false,
    [PERMISSIONS.ACCESS_USER]: false,
  },
  [ROLE.GUEST]: {
    [PERMISSIONS.CREATE_USER]: false,
    [PERMISSIONS.ACCESS_USER]: false,
  },
};

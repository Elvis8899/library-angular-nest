import { PERMISSIONS, ROLE } from "@app/models/credentials.entity";

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
    [PERMISSIONS.CREATE_BOOK]: true,
    [PERMISSIONS.ACCESS_BOOK]: true,
  },
  [ROLE.CLIENT]: {
    [PERMISSIONS.CREATE_USER]: false,
    [PERMISSIONS.ACCESS_USER]: false,
    [PERMISSIONS.CREATE_BOOK]: false,
    [PERMISSIONS.ACCESS_BOOK]: true,
  },
  [ROLE.GUEST]: {
    [PERMISSIONS.CREATE_USER]: false,
    [PERMISSIONS.ACCESS_USER]: false,
    [PERMISSIONS.CREATE_BOOK]: false,
    [PERMISSIONS.ACCESS_BOOK]: false,
  },
};

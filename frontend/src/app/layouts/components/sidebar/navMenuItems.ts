import { ROLE } from "@app/models/credentials.entity";
import { NavMenuItem } from "@app/models/navMenuItem.interface";

export const sidebarMenuItems: NavMenuItem[] = [
  {
    title: "nav.users",
    route: "/users",
    icon: "group",
    roles: [ROLE.ADMIN],
  },
  {
    title: "nav.audit",
    route: "/audit",
    icon: "history",
    roles: [ROLE.ADMIN],
  },
  // Lending example
  {
    title: "nav.books",
    route: "/books",
    icon: "menu_book",
    roles: [ROLE.ADMIN, ROLE.CLIENT],
  },
  {
    title: "nav.rentals",
    route: "/rentals",
    icon: "assignment",
    roles: [ROLE.ADMIN, ROLE.CLIENT],
  },
];

/**
 * Where a role lands after logging in: the first page above it can open, or
 * the home page when it has none.
 */
export const defaultRolePage = (role: ROLE): string =>
  sidebarMenuItems.find((item) => item.roles.includes(role))?.route ?? "/home";

// Shown apart, after the other items
export const sidebarLogoutItem: NavMenuItem = {
  title: "nav.logout",
  route: "/logout",
  icon: "logout",
  roles: [ROLE.ADMIN, ROLE.CLIENT],
};

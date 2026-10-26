import { ROLE } from "@app/models/credentials.entity";
import {
  NavMenuGroup,
  NavMenuItem,
  NavMenuRow,
} from "@app/models/navMenuItem.interface";

const adminGroup: NavMenuGroup = {
  title: "nav.groups.admin",
  icon: "admin_panel_settings",
};

export const sidebarMenuItems: NavMenuItem[] = [
  {
    title: "nav.users",
    route: "/users",
    icon: "group",
    roles: [ROLE.ADMIN],
    group: adminGroup,
  },
  {
    title: "nav.audit",
    route: "/audit",
    icon: "history",
    roles: [ROLE.ADMIN],
    group: adminGroup,
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

/**
 * The sidebar's rows: a group takes the place of its first page the role
 * sees, with the others it sees after it; a group with one page shows it
 * alone
 */
export const menuRows = (items: NavMenuItem[]): NavMenuRow[] =>
  items.flatMap((item): NavMenuRow[] => {
    const members = items.filter(
      (other) => item.group !== undefined && other.group === item.group
    );
    if (members.length < 2) return [{ kind: "item", item }];
    return members[0] === item && item.group
      ? [{ kind: "group", group: item.group, items: members }]
      : [];
  });

// Shown apart, after the other items
export const sidebarLogoutItem: NavMenuItem = {
  title: "nav.logout",
  route: "/logout",
  icon: "logout",
  roles: [ROLE.ADMIN, ROLE.CLIENT],
};

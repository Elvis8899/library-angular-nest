import { ROLE } from "@app/auth";
import { NavMenuItem } from "@core/interfaces";

// THIS FILE CONTAINS THE NAVIGATION MENU ITEMS FOR THE SIDEBAR AND ALL OTHER NAVIGATION MENUS WHICH ARE USED IN THE APPLICATION AND ARE CONSTANT

/**
 * Navigation menu items for WEB Sidebar
 */
export const webSidebarMenuItems: NavMenuItem[] = [
  {
    href: "/users",
    title: "Users",
    active: true,
    icon: "fa-users",
    roles: [ROLE.ADMIN],
  },
  {
    href: "/books",
    title: "Books",
    active: false,
    icon: "fa-money-bill-alt",
    roles: [ROLE.ADMIN, ROLE.CLIENT],
  },
  {
    href: "/rentals",
    title: "Rentals",
    active: false,
    icon: "fa-money-bill-alt",
    roles: [ROLE.ADMIN, ROLE.CLIENT],
  },
  {
    href: "/logout",
    title: "Logout",
    active: false,
    icon: "fa-sign-out-alt",
    roles: [ROLE.ADMIN, ROLE.CLIENT],
  },
  {
    href: "/settings",
    title: "Settings",
    active: false,
    icon: "fa-cog",
    divider: true,
  },
];

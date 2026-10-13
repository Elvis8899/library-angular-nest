import { ROLE } from "@app/models/credentials.entity";
import { NavMenuItem } from "@app/models/navMenuItem.interface";

export const sidebarMenuItems: NavMenuItem[] = [
  {
    title: "Users",
    route: "/users",
    icon: "group",
    roles: [ROLE.ADMIN],
  },
  {
    title: "Books",
    route: "/books",
    icon: "menu_book",
    roles: [ROLE.ADMIN, ROLE.CLIENT],
  },
  {
    title: "Rentals",
    route: "/rentals",
    icon: "assignment",
    roles: [ROLE.ADMIN, ROLE.CLIENT],
  },
];

// Shown apart, after the other items
export const sidebarLogoutItem: NavMenuItem = {
  title: "Logout",
  route: "/logout",
  icon: "logout",
  roles: [ROLE.ADMIN, ROLE.CLIENT],
};

import { ROLE } from "@app/models/credentials.entity";

export interface NavMenuItem {
  // Translation key
  title: string;
  route: string;
  // Material Icons ligature name
  icon: string;
  // Roles that see the item
  roles: ROLE[];
}

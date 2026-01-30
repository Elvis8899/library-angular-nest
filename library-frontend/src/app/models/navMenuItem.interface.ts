import { PERMISSIONS, ROLE } from "@app/models/credentials.entity";

export interface NavMenuItem {
  title: string;
  href: string;
  icon?: string;
  url?: string;
  active?: boolean;
  subItems?: NavMenuItem[];
  disabled?: boolean;
  divider?: boolean;
  roles?: ROLE[];
  permissions?: PERMISSIONS[];
}

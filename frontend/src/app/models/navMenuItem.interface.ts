import { ROLE } from "@app/models/credentials.entity";
import { TranslationKey } from "@app/shared/i18n/translations/translationKey";

// Related pages the sidebar shows under one row that opens and closes
export interface NavMenuGroup {
  title: TranslationKey;
  icon: string;
}

export interface NavMenuItem {
  title: TranslationKey;
  route: string;
  // Material Icons ligature name
  icon: string;
  // Roles that see the item
  roles: ROLE[];
  // The group it's shown in
  group?: NavMenuGroup;
}

// A row of the sidebar: a page, or a group with two or more of them
export type NavMenuRow =
  | { kind: "item"; item: NavMenuItem }
  | { kind: "group"; group: NavMenuGroup; items: NavMenuItem[] };

import { ROLE } from "@app/models/credentials.entity";
import { TranslationKey } from "@app/shared/i18n/translations/translationKey";

export interface NavMenuItem {
  title: TranslationKey;
  route: string;
  // Material Icons ligature name
  icon: string;
  // Roles that see the item
  roles: ROLE[];
}

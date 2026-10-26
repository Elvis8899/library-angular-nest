import { Component, computed, inject } from "@angular/core";
import { MatIconButton } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import { MatMenu, MatMenuItem, MatMenuTrigger } from "@angular/material/menu";
import { MatTooltip } from "@angular/material/tooltip";
import {
  ThemePreference,
  themePreferences,
  ThemeService,
} from "@app/services/theme.service";
import { t } from "@app/shared/i18n/translations/translationKey";
import { TranslatePipe } from "@ngx-translate/core";

const preferenceNames = {
  auto: t("theme.auto"),
  light: t("theme.light"),
  dark: t("theme.dark"),
};

const preferenceIcons: Record<ThemePreference, string> = {
  auto: "brightness_auto",
  light: "light_mode",
  dark: "dark_mode",
};

/** Picks the theme: Automático (the system's), Claro or Escuro. */
@Component({
  selector: "app-theme-toggle",
  templateUrl: "./themeToggle.component.html",
  imports: [
    MatIconButton,
    MatIcon,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    MatTooltip,
    TranslatePipe,
  ],
})
export class ThemeToggleComponent {
  readonly theme = inject(ThemeService);

  readonly preferences = themePreferences;
  readonly names = preferenceNames;
  readonly icons = preferenceIcons;
  readonly icon = computed(() => preferenceIcons[this.theme.preference()]);
}

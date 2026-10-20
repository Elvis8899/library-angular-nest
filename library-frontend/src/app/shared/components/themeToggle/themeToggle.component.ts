import { Component, computed, inject } from "@angular/core";
import { MatIconButton } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import { MatTooltip } from "@angular/material/tooltip";
import { ThemeService } from "@app/services/theme.service";
import { TranslatePipe } from "@ngx-translate/core";

/** Switches between the light and dark schemes. */
@Component({
  selector: "app-theme-toggle",
  templateUrl: "./themeToggle.component.html",
  imports: [MatIconButton, MatIcon, MatTooltip, TranslatePipe],
})
export class ThemeToggleComponent {
  readonly theme = inject(ThemeService);

  // Describes what a click does: switch to the other scheme
  readonly label = computed(() =>
    this.theme.colorScheme() === "dark" ? "Light theme" : "Dark theme"
  );
  readonly icon = computed(() =>
    this.theme.colorScheme() === "dark" ? "light_mode" : "dark_mode"
  );
}

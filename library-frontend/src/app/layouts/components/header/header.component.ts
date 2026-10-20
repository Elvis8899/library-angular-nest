import { Component, inject, input, output } from "@angular/core";
import { MatIconButton } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import { CredentialsService } from "@app/services/credentials.service";
import { ThemeToggleComponent } from "@app/shared/components/themeToggle/themeToggle.component";
import { LanguageSelectorComponent } from "@app/shared/i18n/languageSelector/languageSelector.component";
import { TranslatePipe } from "@ngx-translate/core";

/**
 * The logged-in user, the theme and language switches and, on small screens,
 * the button that opens the menu.
 */
@Component({
  selector: "app-header",
  templateUrl: "./header.component.html",
  styleUrls: ["./header.component.scss"],
  imports: [
    TranslatePipe,
    LanguageSelectorComponent,
    ThemeToggleComponent,
    MatIconButton,
    MatIcon,
  ],
})
export class HeaderComponent {
  private readonly _credentialsService = inject(CredentialsService);

  readonly menuOpen = input(false);
  readonly menuToggle = output<void>();

  // The layout only exists while logged in
  userName() {
    return this._credentialsService.credentials?.user.name ?? "";
  }

  isAdmin() {
    return this._credentialsService.isAdmin();
  }

  // First and last name's initials: "Ana Maria Souza" → "AS"
  initials() {
    const words = this.userName().trim().split(/\s+/).filter(Boolean);
    const first = words[0]?.[0] ?? "";
    const last = words.length > 1 ? words[words.length - 1][0] : "";
    return (first + last).toUpperCase();
  }
}

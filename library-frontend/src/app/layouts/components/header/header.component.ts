import { Component, inject } from "@angular/core";
import { MatIconButton } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import { MatTooltip } from "@angular/material/tooltip";
import { ThemeService } from "@app/services/theme.service";
import { LanguageSelectorComponent } from "@app/shared/i18n/languageSelector/languageSelector.component";
import { UntilDestroy } from "@ngneat/until-destroy";
import { TranslateDirective, TranslatePipe } from "@ngx-translate/core";

@UntilDestroy()
@Component({
  selector: "app-header",
  templateUrl: "./header.component.html",
  styleUrls: ["./header.component.scss"],
  imports: [
    TranslateDirective,
    TranslatePipe,
    LanguageSelectorComponent,
    MatIconButton,
    MatIcon,
    MatTooltip,
  ],
})
export class HeaderComponent {
  readonly theme = inject(ThemeService);
}

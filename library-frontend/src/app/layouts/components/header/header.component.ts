import { Component } from "@angular/core";
import { ThemeToggleComponent } from "@app/shared/components/themeToggle/themeToggle.component";
import { LanguageSelectorComponent } from "@app/shared/i18n/languageSelector/languageSelector.component";
import { UntilDestroy } from "@ngneat/until-destroy";
import { TranslateDirective } from "@ngx-translate/core";

@UntilDestroy()
@Component({
  selector: "app-header",
  templateUrl: "./header.component.html",
  styleUrls: ["./header.component.scss"],
  imports: [
    TranslateDirective,
    LanguageSelectorComponent,
    ThemeToggleComponent,
  ],
})
export class HeaderComponent {}

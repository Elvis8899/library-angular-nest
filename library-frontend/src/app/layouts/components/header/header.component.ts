import { Component } from "@angular/core";
import { LanguageSelectorComponent } from "@app/shared/i18n/language-selector/language-selector.component";
import { UntilDestroy } from "@ngneat/until-destroy";
import { TranslateDirective } from "@ngx-translate/core";

@UntilDestroy()
@Component({
  selector: "app-header",
  templateUrl: "./header.component.html",
  styleUrls: ["./header.component.scss"],
  imports: [TranslateDirective, LanguageSelectorComponent],
})
export class HeaderComponent {}

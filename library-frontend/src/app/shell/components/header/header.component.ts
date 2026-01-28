import { Component } from "@angular/core";
import { UntilDestroy } from "@ngneat/until-destroy";
import { TranslateDirective } from "@ngx-translate/core";
import { RouterLink } from "@angular/router";
import { LanguageSelectorComponent } from "@app/i18n";

@UntilDestroy()
@Component({
  selector: "app-header",
  templateUrl: "./header.component.html",
  styleUrls: ["./header.component.scss"],
  imports: [TranslateDirective, LanguageSelectorComponent, RouterLink],
})
export class HeaderComponent {
  menuHidden = false;
  hide() {
    this.menuHidden = !this.menuHidden;
  }
}

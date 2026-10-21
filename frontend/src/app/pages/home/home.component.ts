import { Component, inject } from "@angular/core";
import { CredentialsService } from "@app/services/credentials.service";
import { PageHeaderComponent } from "@app/shared/components/pageHeader/pageHeader.component";
import { TranslatePipe } from "@ngx-translate/core";

/** Where a role that has no pages in the menu lands (defaultRolePage). */
@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  imports: [PageHeaderComponent, TranslatePipe],
})
export class HomeComponent {
  readonly userName = inject(CredentialsService).credentials?.user.name ?? "";
}

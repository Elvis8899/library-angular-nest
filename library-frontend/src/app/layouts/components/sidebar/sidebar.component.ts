import { NgTemplateOutlet } from "@angular/common";
import { Component, inject, signal } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";
import { RouterLink, RouterLinkActive } from "@angular/router";
import {
  sidebarLogoutItem,
  sidebarMenuItems,
} from "@app/layouts/components/sidebar/navMenuItems";
import { CredentialsService } from "@app/services/credentials.service";
import { TranslatePipe } from "@ngx-translate/core";

@Component({
  selector: "app-sidebar",
  templateUrl: "./sidebar.component.html",
  styleUrl: "./sidebar.component.scss",
  imports: [
    NgTemplateOutlet,
    RouterLink,
    RouterLinkActive,
    MatIconModule,
    TranslatePipe,
  ],
})
export class SidebarComponent {
  private readonly _credentialsService = inject(CredentialsService);

  readonly expanded = signal(true);

  // The layout only exists while logged in, so the role can't change here
  readonly items = sidebarMenuItems.filter((item) =>
    this._credentialsService.hasRole(item.roles)
  );
  readonly logoutItem = sidebarLogoutItem;

  toggle(): void {
    this.expanded.update((expanded) => !expanded);
  }
}

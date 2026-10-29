import { NgTemplateOutlet } from "@angular/common";
import {
  Component,
  computed,
  inject,
  linkedSignal,
  signal,
} from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { MatIconModule } from "@angular/material/icon";
import { MatListModule } from "@angular/material/list";
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
} from "@angular/router";
import {
  menuRows,
  sidebarLogoutItem,
  sidebarMenuItems,
} from "@app/layouts/components/sidebar/navMenuItems";
import { NavMenuGroup } from "@app/models/navMenuItem.interface";
import { CredentialsService } from "@app/services/credentials.service";
import { TranslatePipe } from "@ngx-translate/core";
import { filter, map } from "rxjs";

@Component({
  selector: "app-sidebar",
  templateUrl: "./sidebar.component.html",
  styleUrl: "./sidebar.component.scss",
  imports: [
    NgTemplateOutlet,
    RouterLink,
    RouterLinkActive,
    MatIconModule,
    MatListModule,
    TranslatePipe,
  ],
})
export class SidebarComponent {
  private readonly _credentialsService = inject(CredentialsService);
  private readonly _router = inject(Router);

  readonly expanded = signal(true);

  // The layout only exists while logged in, so the role can't change here
  readonly items = sidebarMenuItems.filter((item) =>
    this._credentialsService.hasRole(item.roles),
  );
  readonly rows = menuRows(this.items);
  readonly logoutItem = sidebarLogoutItem;

  private readonly _path = toSignal(
    this._router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this._router.url),
    ),
    { initialValue: this._router.url },
  );

  // The group of the current page, which opens on reaching it
  readonly currentGroup = computed(() => {
    const path = this._path().split(/[?#]/)[0];
    return this.items.find(
      ({ route }) => path === route || path.startsWith(`${route}/`),
    )?.group;
  });

  private readonly _open = linkedSignal<
    NavMenuGroup | undefined,
    ReadonlySet<NavMenuGroup>
  >({
    source: this.currentGroup,
    computation: (group, previous) =>
      new Set([...(previous?.value ?? []), ...(group ? [group] : [])]),
  });

  toggle(): void {
    this.expanded.update((expanded) => !expanded);
  }

  isOpen(group: NavMenuGroup): boolean {
    return this._open().has(group);
  }

  // On the icons-only sidebar a group's row expands it, showing the group
  toggleGroup(group: NavMenuGroup): void {
    if (!this.expanded()) {
      this.expanded.set(true);
      this._open.update((open) => new Set([...open, group]));
      return;
    }
    this._open.update((open) => {
      const next = new Set(open);
      if (!next.delete(group)) next.add(group);
      return next;
    });
  }
}

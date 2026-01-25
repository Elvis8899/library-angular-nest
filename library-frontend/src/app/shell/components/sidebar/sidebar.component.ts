import { Component, inject, OnInit } from "@angular/core";
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
} from "@angular/router";
import { environment } from "@env/environment";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { filter } from "rxjs/operators";
import { NavMode, ShellService } from "@app/shell/services/shell.service";
import { webSidebarMenuItems } from "@core/constants";
import { NavMenuItem } from "@core/interfaces";
import { NgClass } from "@angular/common";
import { TranslatePipe } from "@ngx-translate/core";

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-sidebar",
  templateUrl: "./sidebar.component.html",
  styleUrls: ["./sidebar.component.scss"],
  imports: [NgClass, RouterLink, RouterLinkActive, TranslatePipe],
})
export class SidebarComponent implements OnInit {
  version: string = environment.version;
  year: number = new Date().getFullYear();
  sidebarItems: NavMenuItem[] = [];
  sidebarExtendedItem = -1;
  navExpanded = true;

  private readonly _shellService = inject(ShellService);
  private readonly _router = inject(Router);

  constructor() {
    this.sidebarItems = webSidebarMenuItems;
  }

  ngOnInit(): void {
    this._shellService.activeNavTab(
      this.sidebarItems,
      this.sidebarExtendedItem
    );

    this._router.events
      .pipe(untilDestroyed(this))
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this._shellService.activeNavTab(
          this.sidebarItems,
          this.sidebarExtendedItem
        );
      });

    this._shellService.navMode$.pipe(untilDestroyed(this)).subscribe((mode) => {
      /**
       * Change the second condition to mode === NavMode.Locked to make navbar by default collapsed
       */
      this.navExpanded = mode === NavMode.Free;
    });
  }

  toggleSidebar(isEnterEvent: boolean): void {
    this._shellService.navMode$.pipe(untilDestroyed(this)).subscribe((mode) => {
      if (isEnterEvent) {
        this.navExpanded = true;
      } else if (!isEnterEvent && mode === NavMode.Free) {
        this.navExpanded = false;
      }
    });
  }

  activateSidebarItem(index: number): void {
    const item = this.sidebarItems[index];
    if (item.disabled) return;

    if (index !== this.sidebarExtendedItem) {
      this.sidebarExtendedItem = index;
    } else {
      this.sidebarExtendedItem = -1; // Toggle the same item
    }

    this._shellService.activateNavItem(index, this.sidebarItems);
  }

  activateSidebarSubItem(index: number, subItem: NavMenuItem): void {
    this._shellService.activateNavSubItem(index, subItem, this.sidebarItems);
  }

  isItemAllowed(item: NavMenuItem): boolean {
    return this._shellService.allowedAccess(item);
  }
}

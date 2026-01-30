import { NgClass } from "@angular/common";
import { Component, inject, OnInit } from "@angular/core";
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
} from "@angular/router";
import { webSidebarMenuItems } from "@app/layouts/components/sidebar/nav-menu-items";
import { NavMenuItem } from "@app/models/navMenuItem.interface";
import { CredentialsService } from "@app/services/credentials.service";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { TranslatePipe } from "@ngx-translate/core";
import { BehaviorSubject } from "rxjs";
import { filter } from "rxjs/operators";

enum NavMode {
  Locked,
  Free,
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-sidebar",
  templateUrl: "./sidebar.component.html",
  styleUrls: ["./sidebar.component.scss"],
  imports: [NgClass, RouterLink, RouterLinkActive, TranslatePipe],
})
export class SidebarComponent implements OnInit {
  // version: string = environment.version;
  // year: number = new Date().getFullYear();
  sidebarItems: NavMenuItem[] = [];
  sidebarExtendedItem = -1;
  navExpanded = true;

  navModeSubject = new BehaviorSubject<NavMode>(NavMode.Free);
  navMode$ = this.navModeSubject.asObservable();

  private readonly _router = inject(Router);
  private readonly _permissionService = inject(CredentialsService);

  constructor() {
    this.sidebarItems = webSidebarMenuItems;
  }

  ngOnInit(): void {
    this.activeNavTab(this.sidebarItems, this.sidebarExtendedItem);

    this._router.events
      .pipe(untilDestroyed(this))
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.activeNavTab(this.sidebarItems, this.sidebarExtendedItem);
      });

    this.navMode$.pipe(untilDestroyed(this)).subscribe((mode) => {
      /**
       * Change the second condition to mode === NavMode.Locked to make navbar by default collapsed
       */
      this.navExpanded = mode === NavMode.Free;
    });
  }

  toggleSidebar(isEnterEvent: boolean): void {
    this.navMode$.pipe(untilDestroyed(this)).subscribe((mode) => {
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

    this.activateNavItem(index, this.sidebarItems);
  }

  activateSidebarSubItem(index: number, subItem: NavMenuItem): void {
    if (subItem.disabled) return;
    subItem.active = true;
    this.sidebarItems[index].active = true;
    // disable all other subitems
    this.sidebarItems[index].subItems
      ?.filter((item) => item !== subItem)
      .forEach((item) => {
        item.active = false;
      });
    if (subItem.href) {
      this._router.navigate([subItem.href]);
    }

    if (subItem.url) {
      window.open(subItem.url, "_blank");
    }
  }

  isItemAllowed(item: NavMenuItem): boolean {
    const roleCheck = this._permissionService.hasRole(item.roles);
    const permissionCheck = this._permissionService.hasPermission(
      item.permissions
    );

    return roleCheck && permissionCheck;
  }

  activeNavTab(items: NavMenuItem[], extendedItem: number): void {
    items.forEach((item, index) => {
      if (!item.href) {
        item.active = false;
        return;
      }
      const splitAndFilter = (str: string) =>
        str.split("/").filter((s) => s.length > 0);
      const urlSegments = splitAndFilter(this._router.url);
      const hrefSegments = splitAndFilter(item.href);
      const isActive = hrefSegments.every(
        (segment, i) => segment === urlSegments[i]
      );

      item.active = isActive;

      if (isActive && extendedItem) {
        extendedItem = index;
      }

      if (item.subItems) {
        item.subItems.forEach((subItem) => {
          if (subItem.href) {
            const subItemHrefSegments = splitAndFilter(subItem.href);
            subItem.active = subItemHrefSegments.every(
              (segment, i) => segment === urlSegments[i]
            );
          }
        });
      }
    });
  }

  activateNavItem(index: number, navItems: NavMenuItem[]): void {
    const item = navItems[index];
    if (item.disabled) return;

    setTimeout(() => {
      const element = document.getElementById(`menu-item-${index}`);
      const navElement = document.querySelector("nav");

      if (element && navElement) {
        const elementRect = element.getBoundingClientRect();
        const navRect = navElement.getBoundingClientRect();

        const relativeTop = elementRect.top - navRect.top;
        const desiredScrollPosition =
          navElement.scrollTop + relativeTop - navRect.height / 2;

        navElement.scrollTo({ top: desiredScrollPosition, behavior: "smooth" });
      }
    }, 0);

    if (item && !item.subItems?.length) {
      this._router.navigate([item.href]);
    } else {
      // set false to all subitems of all items
      navItems.forEach((item) => {
        if (item.subItems) {
          item.subItems.forEach((subItem) => {
            subItem.active = false;
          });
        }
      });
    }
  }
}

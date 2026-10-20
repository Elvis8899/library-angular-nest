import { Component, DestroyRef, inject, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { NavigationEnd, Router, RouterOutlet } from "@angular/router";
import { HeaderComponent } from "@app/layouts/components/header/header.component";
import { SidebarComponent } from "@app/layouts/components/sidebar/sidebar.component";
import { filter } from "rxjs";

/**
 * The logged-in pages: sidebar, header and the page. On small screens the
 * sidebar is a menu that slides in from the header's menu button.
 */
@Component({
  templateUrl: "./layout.component.html",
  imports: [SidebarComponent, HeaderComponent, RouterOutlet],
  host: { "(document:keydown.escape)": "closeMenu()" },
})
export class LayoutComponent {
  readonly menuOpen = signal(false);

  constructor() {
    // Picking a page closes the menu
    inject(Router)
      .events.pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(inject(DestroyRef))
      )
      .subscribe(() => this.closeMenu());
  }

  toggleMenu() {
    this.menuOpen.update((open) => !open);
  }

  closeMenu() {
    this.menuOpen.set(false);
  }
}

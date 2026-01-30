import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { RouterModule } from "@angular/router";
import { HeaderComponent } from "@app/layouts/components/header/header.component";
import { SidebarComponent } from "@app/layouts/components/sidebar/sidebar.component";
import { UntilDestroy } from "@ngneat/until-destroy";
@UntilDestroy()
@Component({
  templateUrl: "./layout.component.html",
  imports: [CommonModule, SidebarComponent, HeaderComponent, RouterModule],
})
export class LayoutComponent implements OnInit {
  isSidebarActive = false;

  ngOnInit() {
    this.isSidebarActive = false;
  }

  sidebarToggle(toggleState: boolean) {
    this.isSidebarActive = toggleState;
  }
}

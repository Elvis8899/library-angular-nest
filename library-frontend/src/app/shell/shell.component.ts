import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { RouterModule } from "@angular/router";
import { HeaderComponent } from "@app/shell/components/header/header.component";
import { SidebarComponent } from "@app/shell/components/sidebar/sidebar.component";
import { UntilDestroy } from "@ngneat/until-destroy";
@UntilDestroy()
@Component({
  selector: "app-shell",
  templateUrl: "./shell.component.html",
  imports: [CommonModule, SidebarComponent, HeaderComponent, RouterModule],
})
export class ShellComponent implements OnInit {
  isSidebarActive = false;

  ngOnInit() {
    this.isSidebarActive = false;
  }

  sidebarToggle(toggleState: boolean) {
    this.isSidebarActive = toggleState;
  }
}

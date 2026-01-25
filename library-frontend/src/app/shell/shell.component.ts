import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { UntilDestroy } from "@ngneat/until-destroy";
import { SidebarComponent } from "./components/sidebar/sidebar.component";
import { HeaderComponent } from "./components/header/header.component";
import { RouterModule } from "@angular/router";
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

import { Component, inject, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { AuthenticationService } from "@app/services/authentication.service";
import { Logger } from "@app/services/logger.service";

const log = new Logger("LogoutComponent");

@Component({
  selector: "app-logout",
  template: "<p>Logged Out!</p>",
})
export class LogoutComponent implements OnInit {
  private readonly _authService = inject(AuthenticationService);
  private readonly _router = inject(Router);

  ngOnInit() {
    this.init();
  }

  init() {
    this._authService.logout().subscribe({
      next: this.logout.bind(this),
      error: () => {
        log.error("Error logging out");
      },
    });
  }

  logout() {
    this._router.navigate(["/login"]).then(() => {
      window.location.reload();
    });
  }
}

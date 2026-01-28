import { Component, inject, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { Logger } from "@app/@core/services";
import { AuthenticationService, CredentialsService } from "@auth";

const log = new Logger("LogoutComponent");

@Component({
  selector: "app-logout",
  template: "<p>Logged Out!</p>",
})
export class LogoutComponent implements OnInit {
  private readonly _authService = inject(AuthenticationService);
  private readonly _router = inject(Router);
  private readonly _credentialsService = inject(CredentialsService);

  ngOnInit() {
    if (!this._credentialsService.isAuthenticated()) {
      this._credentialsService.setCredentials();
      this._router.navigate(["/login"]).then(() => {
        window.location.reload();
      });
    } else {
      this._authService.logout().subscribe({
        next: () => {
          this._credentialsService.setCredentials();
          this._router.navigate(["/login"]).then(() => {
            window.location.reload();
          });
        },
        error: () => {
          log.error("Error logging out");
        },
      });
    }
  }
}

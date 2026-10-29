import { Component, inject, OnInit } from "@angular/core";
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { Router } from "@angular/router";
import { AuthenticationService } from "@app/services/authentication.service";
import { Logger } from "@app/services/logger.service";
import { TranslatePipe } from "@ngx-translate/core";

const log = new Logger("LogoutComponent");

/** Shown while logging out, then goes to the login page. */
@Component({
  selector: "app-logout",
  template: `
    <main class="logout" role="status">
      <mat-progress-spinner diameter="40" mode="indeterminate" />
      <p>{{ "auth.logout.inProgress" | translate }}</p>
    </main>
  `,
  styles: `
    .logout {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      align-items: center;
      justify-content: center;
      min-height: 100dvh;
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-large);
    }
  `,
  imports: [MatProgressSpinner, TranslatePipe],
})
export class LogoutComponent implements OnInit {
  private readonly _authService = inject(AuthenticationService);
  private readonly _router = inject(Router);

  ngOnInit() {
    // The login page either way: logging out clears the session even when
    // the API can't be reached
    this._authService.logout().subscribe({
      next: () => this.goToLogin(),
      error: (error) => {
        log.error("Error logging out", error);
        this.goToLogin();
      },
    });
  }

  goToLogin() {
    void this._router.navigate(["/login"]);
  }
}

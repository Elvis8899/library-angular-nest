import { Component, DestroyRef, inject, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButton, MatIconButton } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIcon } from "@angular/material/icon";
import { MatInput } from "@angular/material/input";
import { ActivatedRoute, Router } from "@angular/router";
import { defaultRolePage } from "@app/layouts/components/sidebar/navMenuItems";
import { AuthenticationService } from "@app/services/authentication.service";
import { NotificationService } from "@app/services/notification.service";
import { ThemeToggleComponent } from "@app/shared/components/themeToggle/themeToggle.component";
import { BusyDirective } from "@app/shared/directives/busy.directive";
import { LanguageSelectorComponent } from "@app/shared/i18n/languageSelector/languageSelector.component";
import { ApiError } from "@app/shared/utils/apiError.utility";
import { TranslatePipe } from "@ngx-translate/core";
import { finalize } from "rxjs";

@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"],
  imports: [
    ReactiveFormsModule,
    MatButton,
    MatIconButton,
    MatCardModule,
    MatFormFieldModule,
    MatIcon,
    MatInput,
    BusyDirective,
    LanguageSelectorComponent,
    ThemeToggleComponent,
    TranslatePipe,
  ],
})
export class LoginComponent {
  private readonly _router = inject(Router);
  private readonly _route = inject(ActivatedRoute);
  private readonly _fb = inject(FormBuilder);
  private readonly _authService = inject(AuthenticationService);
  private readonly _notify = inject(NotificationService);
  private readonly _destroyRef = inject(DestroyRef);

  // The API only requires a password, so no length rule here
  loginForm = this._fb.nonNullable.group({
    email: ["", [Validators.required, Validators.email]],
    password: ["", Validators.required],
  });

  readonly loading = signal(false);
  readonly passwordVisible = signal(false);

  togglePasswordVisibility() {
    this.passwordVisible.update((visible) => !visible);
  }

  login() {
    if (this.loginForm.invalid) {
      // Shows the fields' errors
      this.loginForm.markAllAsTouched();
      return;
    }
    if (this.loading()) return;
    this.loading.set(true);
    this._authService
      .login(this.loginForm.getRawValue())
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this._destroyRef),
      )
      .subscribe({
        next: (credentials) => {
          const route = defaultRolePage(credentials.user?.role);
          const redirect = this._route.snapshot.queryParams["redirect"] as
            string | undefined;
          void this._router.navigate([redirect || route], { replaceUrl: true });
        },
        error: (error: ApiError & { error?: ApiError }) => {
          this._notify.errorMessage(
            error.error?.message || error.message || "",
          );
        },
      });
  }
}

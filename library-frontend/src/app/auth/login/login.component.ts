import { Component, inject } from "@angular/core";

import { environment } from "@env/environment";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { AuthenticationService, CredentialsService } from "@app/auth";
import { ActivatedRoute, Router } from "@angular/router";
import { FormBuilder, Validators, ReactiveFormsModule } from "@angular/forms";
import { HotToastService } from "@ngxpert/hot-toast";
import { TranslateDirective, TranslatePipe } from "@ngx-translate/core";
import { NgIf } from "@angular/common";
import { LanguageSelectorComponent } from "../../i18n/language-selector.component";

@UntilDestroy()
@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"],
  imports: [
    TranslateDirective,
    ReactiveFormsModule,
    NgIf,
    LanguageSelectorComponent,
    TranslatePipe,
  ],
})
export class LoginComponent {
  version: string | null = environment.version;

  private readonly _router = inject(Router);
  private readonly _route = inject(ActivatedRoute);
  private readonly _authService = inject(AuthenticationService);
  private readonly _credentialsService = inject(CredentialsService);
  private readonly _fb = inject(FormBuilder);

  // eslint-disable-next-line @typescript-eslint/member-ordering
  loginForm = this._fb.group({
    email: [
      "",
      [Validators.email, Validators.required, Validators.minLength(4)],
    ],
    password: ["", [Validators.required, Validators.minLength(4)]],
  });

  private readonly _toast = inject(HotToastService);

  login() {
    // Here You can call the login method from the AuthenticationService directly and pass the required parameters.
    // setting credentials and other logic will be handled in the AuthenticationService.
    this._authService
      .login({
        email: this.loginForm.value.email || "",
        password: this.loginForm.value.password || "",
      })
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (credentials) => {
          // Navigate to the home page or any other page after successful login.
          if (credentials) {
            this._credentialsService.setCredentials(credentials);
            console.log("Login successful");
            const route =
              credentials.user?.role === "admin" ? "/users/list" : "/books";
            this._router
              .navigate(
                [this._route.snapshot.queryParams["redirect"] || route],
                { replaceUrl: true }
              )
              .then(() => {
                // Handle the navigation
                console.log("Navigated to initial route");
              });
          }
        },
        error: (error) => {
          this._toast.error(error?.error?.message || error?.message);
        },
      });
  }
}

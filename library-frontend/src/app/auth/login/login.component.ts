import { Component, inject } from '@angular/core';

import { environment } from '@env/environment';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { AuthenticationService, CredentialsService } from '@app/auth';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, UntypedFormBuilder, Validators } from '@angular/forms';

@UntilDestroy()
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: false,
})
export class LoginComponent {
  version: string | null = environment.version;

  constructor(
    private readonly _router: Router,
    private readonly _route: ActivatedRoute,
    private readonly _authService: AuthenticationService,
    private readonly _credentialsService: CredentialsService,
    private fb: FormBuilder,
  ) {}
  loginForm = this.fb.group({
    email: ['', [Validators.email, Validators.required, Validators.minLength(4)]],
    password: ['', [Validators.required, Validators.minLength(4)]],
  });
  login() {
    // Here You can call the login method from the AuthenticationService directly and pass the required parameters.
    // setting credentials and other logic will be handled in the AuthenticationService.
    this._authService
      .login({
        email: this.loginForm.value.email,
        password: this.loginForm.value.password,
      })
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (credentials) => {
          // Navigate to the home page or any other page after successful login.
          if (credentials) {
            this._credentialsService.setCredentials(credentials);
            console.log('Login successful');
            this._router.navigate([this._route.snapshot.queryParams['redirect'] || '/dashboard'], { replaceUrl: true }).then(() => {
              // Handle the navigation
              console.log('Navigated to dashboard');
            });
          }
        },
        error: (error) => {
          // Handle the error here
        },
      });
  }
}

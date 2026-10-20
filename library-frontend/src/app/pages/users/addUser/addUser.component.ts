import { Component, inject, signal } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButton, MatIconButton } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIcon } from "@angular/material/icon";
import { MatInput } from "@angular/material/input";
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { Router, RouterLink } from "@angular/router";
import { ROLE } from "@app/models/credentials.entity";
import { Logger } from "@app/services/logger.service";
import { UserService } from "@app/services/user.http.service";
import { FormCardComponent } from "@app/shared/components/formCard/formCard.component";
import { FormValidatorUtility } from "@app/shared/utils/formValidators.utility";
import { TranslatePipe, TranslateService } from "@ngx-translate/core";
import { HotToastService } from "@ngxpert/hot-toast";
import { finalize } from "rxjs";

const log = new Logger("AddUsersComponent");

@Component({
  selector: "app-add-user",
  templateUrl: "./addUser.component.html",
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButton,
    MatIconButton,
    MatFormFieldModule,
    MatIcon,
    MatInput,
    MatProgressSpinner,
    FormCardComponent,
    TranslatePipe,
  ],
})
export class AddUsersComponent {
  private readonly _userService = inject(UserService);
  private readonly _router = inject(Router);
  private readonly _fb = inject(FormBuilder);
  private readonly _toast = inject(HotToastService);
  private readonly _translate = inject(TranslateService);

  // Clients need a CPF or CNPJ with valid check digits, as the API checks
  addUserForm = this._fb.nonNullable.group({
    name: ["", Validators.required],
    email: ["", [Validators.required, Validators.email]],
    cpf: ["", [Validators.required, FormValidatorUtility.validateDocument()]],
    password: ["", [Validators.required, Validators.minLength(4)]],
  });

  readonly saving = signal(false);
  readonly passwordVisible = signal(false);

  togglePasswordVisibility() {
    this.passwordVisible.update((visible) => !visible);
  }

  onSubmit() {
    if (this.addUserForm.invalid) {
      this.addUserForm.markAllAsTouched();
      return;
    }
    if (this.saving()) return;
    this.saving.set(true);
    this._userService
      .addUser({ ...this.addUserForm.getRawValue(), role: ROLE.CLIENT })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this._toast.success(
            this._translate.instant("User created successfully")
          );
          this._router.navigate(["/users/list"]);
        },
        error: (error: Error) => {
          this._toast.error(error?.message);
          log.error(error);
        },
      });
  }
}

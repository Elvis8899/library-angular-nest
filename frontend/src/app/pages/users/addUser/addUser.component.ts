import { Component, inject, signal } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButton, MatIconButton } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIcon } from "@angular/material/icon";
import { MatInput } from "@angular/material/input";
import { Router, RouterLink } from "@angular/router";
import { ROLE } from "@app/models/credentials.entity";
import { Logger } from "@app/services/logger.service";
import { NotificationService } from "@app/services/notification.service";
import { UserService } from "@app/services/user.http.service";
import { FormCardComponent } from "@app/shared/components/formCard/formCard.component";
import { BusyDirective } from "@app/shared/directives/busy.directive";
import { FormValidatorUtility } from "@app/shared/utils/formValidators.utility";
import { injectSaving } from "@app/shared/utils/saving.utility";
import { TranslatePipe } from "@ngx-translate/core";

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
    BusyDirective,
    FormCardComponent,
    TranslatePipe,
  ],
})
export class AddUsersComponent {
  private readonly _userService = inject(UserService);
  private readonly _router = inject(Router);
  private readonly _fb = inject(FormBuilder);
  private readonly _notify = inject(NotificationService);

  // Clients need a CPF or CNPJ with valid check digits, as the API checks
  addUserForm = this._fb.nonNullable.group({
    name: ["", Validators.required],
    email: ["", [Validators.required, Validators.email]],
    cpf: ["", [Validators.required, FormValidatorUtility.validateDocument()]],
    password: ["", [Validators.required, Validators.minLength(4)]],
  });

  readonly saving = injectSaving(log);
  readonly passwordVisible = signal(false);

  togglePasswordVisibility() {
    this.passwordVisible.update((visible) => !visible);
  }

  onSubmit() {
    if (this.addUserForm.invalid) {
      this.addUserForm.markAllAsTouched();
      return;
    }
    this.saving.run(
      this._userService.addUser({
        ...this.addUserForm.getRawValue(),
        role: ROLE.CLIENT,
      }),
      () => {
        this._notify.success("users.created");
        this._router.navigate(["/users/list"]);
      }
    );
  }
}

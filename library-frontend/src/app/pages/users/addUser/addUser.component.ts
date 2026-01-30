import { Component, inject, OnInit } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { ROLE } from "@app/models/credentials.entity";
import { UserEntity } from "@app/models/user.entity";
import { Logger } from "@app/services/logger.service";
import { UserService } from "@app/services/user.service";
import { validateCPF } from "@app/shared/utils/form-validators.utility";
import { HotToastService } from "@ngxpert/hot-toast";
import { noop } from "rxjs";

const log = new Logger("AddUsersComponent");
@Component({
  selector: "app-list",
  templateUrl: "./addUser.component.html",
  styleUrl: "./addUser.component.scss",
  imports: [ReactiveFormsModule],
})
export class AddUsersComponent implements OnInit {
  ngOnInit = noop;
  private readonly _userService = inject(UserService);
  private readonly _router = inject(Router);

  private readonly _fb = inject(FormBuilder);

  addUserForm = this._fb.group({
    name: ["", [Validators.required, Validators.minLength(4)]],
    email: [
      "",
      [Validators.email, Validators.required, Validators.minLength(4)],
    ],
    cpf: ["", [validateCPF(), Validators.required, Validators.minLength(4)]],
    password: ["", [Validators.required, Validators.minLength(4)]],
  });

  private readonly _toast = inject(HotToastService);

  onSubmit() {
    this._userService
      .addUser({
        ...this.addUserForm.value,
        role: ROLE.CLIENT,
      } as Partial<UserEntity>)
      .subscribe({
        next: () => {
          this._toast.success("User created successfully");
          this._router.navigate(["/users/list"]);
        },
        error: (error: Error) => {
          this._toast.error(error?.message);
          log.error(error);
        },
      });
  }

  goToAddUser() {
    this._router.navigate(["/users/add"]);
  }

  userClicked() {
    this._toast.show("User clicked");
  }
}

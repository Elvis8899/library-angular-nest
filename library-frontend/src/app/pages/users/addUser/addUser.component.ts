import { Component, inject, OnInit } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { ROLE } from "@app/auth";
import { UserService } from "@app/auth/services/user.service";
import { Logger } from "@app/core/services";
import { validateCPF } from "@app/core/utils";
import { UserEntity } from "@core/entities";
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

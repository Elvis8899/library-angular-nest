import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { validateCPF } from '@app/@core/utils';
import { ROLE } from '@app/auth';
import { UserService } from '@app/auth/services/user.service';
import { UserEntity } from '@core/entities';
import { HotToastService } from '@ngxpert/hot-toast';

@Component({
  selector: 'app-list',
  templateUrl: './addUser.component.html',
  styleUrl: './addUser.component.scss',
  standalone: false,
})
export class AddUsersComponent implements OnInit {
  constructor(
    private readonly _userService: UserService,
    private readonly _router: Router,

    private fb: FormBuilder,
  ) {}

  addUserForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(4)]],
    email: ['', [Validators.email, Validators.required, Validators.minLength(4)]],
    cpf: ['', [validateCPF(), Validators.required, Validators.minLength(4)]],
    password: ['', [Validators.required, Validators.minLength(4)]],
  });

  users: UserEntity[] = [];
  isLoading = true;

  private readonly _toast = inject(HotToastService);

  ngOnInit() {}

  onSubmit() {
    console.log(this.addUserForm);
    this._userService.addUser({ ...this.addUserForm.value, role: ROLE.CLIENT }).subscribe({
      next: (res) => {
        this._toast.success('User created successfully');
        this._router.navigate(['/users/list']);
      },
      error: (error) => {
        this._toast.error(error?.error?.message);
        console.error(error);
      },
    });
  }

  goToAddUser() {
    this._router.navigate(['/users/add']);
  }

  userClicked() {
    this._toast.show('User clicked');
  }
}

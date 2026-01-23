import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '@app/auth/services/user.service';
import { UserEntity } from '@core/entities';
import { HotToastService } from '@ngxpert/hot-toast';

@Component({
  selector: 'app-list',
  templateUrl: './listUsers.component.html',
  styleUrl: './listUsers.component.scss',
  standalone: false,
})
export class ListUsersComponent implements OnInit {
  constructor(
    private readonly _userService: UserService,
    private readonly _router: Router,
  ) {}
  users: UserEntity[] = [];
  isLoading = true;

  private readonly _toast = inject(HotToastService);

  ngOnInit() {
    this._userService.getPaginatedUsers().subscribe({
      next: (res) => {
        this.users = res.data;
        this.isLoading = false;
      },
      error: (error) => {
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

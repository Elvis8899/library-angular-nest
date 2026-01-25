import { Component, inject, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { UserService } from "@app/auth/services/user.service";
import { UserEntity } from "@core/entities";
import { HotToastService } from "@ngxpert/hot-toast";
import { TranslateDirective } from "@ngx-translate/core";

@Component({
  selector: "app-list",
  templateUrl: "./listUsers.component.html",
  styleUrl: "./listUsers.component.scss",
  imports: [TranslateDirective],
})
export class ListUsersComponent implements OnInit {
  users: UserEntity[] = [];
  isLoading = true;
  private readonly _userService = inject(UserService);
  private readonly _router = inject(Router);

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
    this._router.navigate(["/users/add"]);
  }

  userClicked() {
    this._toast.show("User clicked");
  }
}

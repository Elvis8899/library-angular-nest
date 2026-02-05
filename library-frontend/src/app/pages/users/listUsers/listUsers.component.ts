import { AsyncPipe } from "@angular/common";
import { Component, inject, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { UserEntity } from "@app/models/user.entity";
import { Logger } from "@app/services/logger.service";
import { UserService } from "@app/services/user.service";
import { TranslateDirective } from "@ngx-translate/core";
import { HotToastService } from "@ngxpert/hot-toast";
import { Subject } from "rxjs";

const log = new Logger("ListUsersComponent");

@Component({
  selector: "app-list",
  templateUrl: "./listUsers.component.html",
  styleUrl: "./listUsers.component.scss",
  imports: [TranslateDirective, AsyncPipe],
})
export class ListUsersComponent implements OnInit {
  users: UserEntity[] = [];
  isLoading = new Subject<boolean>();
  loading$ = this.isLoading.asObservable();
  private readonly _userService = inject(UserService);
  private readonly _router = inject(Router);

  private readonly _toast = inject(HotToastService);

  ngOnInit() {
    this.refresh();
  }

  refresh() {
    this._userService.getPaginatedUsers().subscribe({
      next: (res) => {
        this.isLoading.next(false);
        this.users = res.data;
      },
      error: (error) => {
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

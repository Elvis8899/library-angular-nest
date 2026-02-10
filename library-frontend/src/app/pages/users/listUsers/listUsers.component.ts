import { Component, inject, OnInit } from "@angular/core";
import { MatTableModule } from "@angular/material/table";
import { Router } from "@angular/router";
import { UserEntity } from "@app/models/user.entity";
import { PaginatedDataSource } from "@app/models/utils/paginatedDataSource.entity";
import { Logger } from "@app/services/logger.service";
import { UserService } from "@app/services/user.http.service";
import { CustomizedTableComponent } from "@app/shared/components/customized-table/customized-table.component";
import { TranslateDirective } from "@ngx-translate/core";
import { HotToastService } from "@ngxpert/hot-toast";

const log = new Logger("ListUsersComponent");

@Component({
  selector: "app-list",
  templateUrl: "./listUsers.component.html",
  styleUrl: "./listUsers.component.scss",
  imports: [TranslateDirective, CustomizedTableComponent, MatTableModule],
})
export class ListUsersComponent implements OnInit {
  data!: PaginatedDataSource<UserEntity, object>;
  private readonly _userService = inject(UserService);
  private readonly _router = inject(Router);

  private readonly _toast = inject(HotToastService);

  ngOnInit() {
    this.data = new PaginatedDataSource<UserEntity, object>(
      (r) => this._userService.getPaginatedUsers(r),
      {
        log: log,
        query: { name: "" },
        sort: {
          property: "createdAt",
          order: "desc",
        },
        displayedColumns: ["name", "email", "cpf"],
      }
    );
  }

  refresh() {
    this.data.refresh();
  }

  goToAddUser() {
    this._router.navigate(["/users/add"]);
  }

  userClicked() {
    this._toast.show("User clicked");
  }
}

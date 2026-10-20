import { DatePipe } from "@angular/common";
import { Component, inject, OnInit } from "@angular/core";
import { MatButton } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import { MatTableModule } from "@angular/material/table";
import { Router } from "@angular/router";
import { ROLE } from "@app/models/credentials.entity";
import { UserEntity } from "@app/models/user.entity";
import { PaginatedDataSource } from "@app/models/utils/paginatedDataSource.entity";
import { Logger } from "@app/services/logger.service";
import { UserService } from "@app/services/user.http.service";
import { CustomizedTableComponent } from "@app/shared/components/customizedTable/customizedTable.component";
import { PageHeaderComponent } from "@app/shared/components/pageHeader/pageHeader.component";
import { injectCurrentLocale } from "@app/shared/i18n/currentLocale";
import { TranslatePipe } from "@ngx-translate/core";

const log = new Logger("ListUsersComponent");

@Component({
  selector: "app-list-users",
  templateUrl: "./listUsers.component.html",
  styleUrl: "./listUsers.component.scss",
  imports: [
    DatePipe,
    MatButton,
    MatIcon,
    MatTableModule,
    CustomizedTableComponent,
    PageHeaderComponent,
    TranslatePipe,
  ],
})
export class ListUsersComponent implements OnInit {
  data!: PaginatedDataSource<UserEntity, object>;

  readonly locale = injectCurrentLocale();
  readonly ROLE = ROLE;

  private readonly _userService = inject(UserService);
  private readonly _router = inject(Router);

  ngOnInit() {
    this.data = new PaginatedDataSource<UserEntity, object>(
      (r) => this._userService.getPaginatedUsers(r),
      {
        log: log,
        query: {},
        sort: {
          property: "createdAt",
          order: "desc",
        },
        displayedColumns: ["name", "role", "email", "cpf", "createdAt"],
      }
    );
  }

  refresh() {
    this.data.refresh();
  }

  goToAddUser() {
    this._router.navigate(["/users/add"]);
  }
}

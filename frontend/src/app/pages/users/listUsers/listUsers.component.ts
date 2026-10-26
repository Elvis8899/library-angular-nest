import { DatePipe } from "@angular/common";
import { Component, computed, DestroyRef, inject, OnInit } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { MatButton, MatIconButton } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import { MatTableModule } from "@angular/material/table";
import { MatTooltip } from "@angular/material/tooltip";
import { Router } from "@angular/router";
import { ROLE } from "@app/models/credentials.entity";
import { UserEntity } from "@app/models/user.entity";
import { CredentialsService } from "@app/services/credentials.service";
import {
  LiveUpdatesService,
  RESOURCE,
} from "@app/services/liveUpdates.service";
import { Logger } from "@app/services/logger.service";
import { NotificationService } from "@app/services/notification.service";
import { UserService } from "@app/services/user.http.service";
import { ConfirmDialog } from "@app/shared/components/confirmDialog/confirm.dialog.component";
import { CustomizedTableComponent } from "@app/shared/components/customizedTable/customizedTable.component";
import { PaginatedDataSource } from "@app/shared/components/customizedTable/paginatedDataSource";
import { PageHeaderComponent } from "@app/shared/components/pageHeader/pageHeader.component";
import { CellDefDirective } from "@app/shared/directives/cellDef.directive";
import { injectCurrentLocale } from "@app/shared/i18n/currentLocale";
import { injectSaving } from "@app/shared/utils/saving.utility";
import { injectIsSmallScreen } from "@app/shared/utils/smallScreen.utility";
import { TranslatePipe } from "@ngx-translate/core";
import { filter } from "rxjs";

const log = new Logger("ListUsersComponent");

@Component({
  selector: "app-list-users",
  templateUrl: "./listUsers.component.html",
  styleUrl: "./listUsers.component.scss",
  imports: [
    CellDefDirective,
    DatePipe,
    MatButton,
    MatIconButton,
    MatTooltip,
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
  readonly isSmallScreen = injectIsSmallScreen();
  // Small screens leave out the document, the status, the last access and
  // the creation date
  readonly columns = computed(() =>
    this.isSmallScreen()
      ? ["name", "role", "actions"]
      : [
          "name",
          "role",
          "cpf",
          "status",
          "lastAccessAt",
          "createdAt",
          "actions",
        ]
  );
  readonly saving = injectSaving(log);
  // Nobody deactivates their own account
  readonly currentUserId = inject(CredentialsService).userId();
  readonly ROLE = ROLE;

  private readonly _liveUpdates = inject(LiveUpdatesService);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _userService = inject(UserService);
  private readonly _router = inject(Router);
  private readonly _confirm = inject(ConfirmDialog);
  private readonly _notify = inject(NotificationService);

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
        displayedColumns: [
          "name",
          "role",
          "cpf",
          "status",
          "lastAccessAt",
          "createdAt",
          "actions",
        ],
      }
    );
    // What someone else changes shows here too
    this._liveUpdates
      .changes(RESOURCE.USERS)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(() => this.refresh());
  }

  refresh() {
    this.data.refresh();
  }

  deactivate(user: UserEntity) {
    this._confirm
      .confirm({
        title: "users.deactivateDialog.title",
        message: "users.deactivateDialog.message",
        messageParams: { name: user.name },
        confirmLabel: "users.deactivate",
        destructive: true,
      })
      .pipe(filter(Boolean))
      .subscribe(() =>
        this.saving.run(this._userService.deactivateUser(user), () => {
          this._notify.success("users.deactivated");
          this.refresh();
        })
      );
  }

  reactivate(user: UserEntity) {
    this.saving.run(this._userService.reactivateUser(user), () => {
      this._notify.success("users.reactivated");
      this.refresh();
    });
  }

  goToAddUser() {
    this._router.navigate(["/users/add"]);
  }
}

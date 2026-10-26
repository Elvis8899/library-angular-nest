import { BreakpointObserver, BreakpointState } from "@angular/cdk/layout";
import { formatDate } from "@angular/common";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { LOCALE_ID } from "@angular/core";
import { RouterModule } from "@angular/router";
import { ROLE } from "@app/models/credentials.entity";
import { UserEntity } from "@app/models/user.entity";
import { ListUsersComponent } from "@app/pages/users/listUsers/listUsers.component";
import { CredentialsService } from "@app/services/credentials.service";
import {
  LiveUpdatesService,
  RESOURCE,
  ResourceChange,
} from "@app/services/liveUpdates.service";
import { Logger } from "@app/services/logger.service";
import { NotificationService } from "@app/services/notification.service";
import { UserService } from "@app/services/user.http.service";
import { ConfirmDialog } from "@app/shared/components/confirmDialog/confirm.dialog.component";
import { MockComponent } from "@app/shared/utils/test/mockComponent";
import { provideTranslateService } from "@ngx-translate/core";
import {
  createComponentFactory,
  createSpyObject,
  Spectator,
} from "@openng/spectator/vitest";
import { BehaviorSubject, of, Subject, throwError } from "rxjs";

Logger.level = 0;

describe("ListUsersComponent", () => {
  let spectator!: Spectator<ListUsersComponent>;
  let httpMock: HttpTestingController;
  const users: UserEntity[] = [
    {
      id: "1",
      name: "test",
      email: "test@example.com",
      cpf: "test",
      role: ROLE.ADMIN,
      active: true,
      lastAccessAt: null,
      createdAt: new Date().toDateString(),
      updatedAt: new Date().toDateString(),
    },
  ];
  const userServiceMock = createSpyObject(UserService);
  userServiceMock.getPaginatedUsers.mockReturnValue(
    of({ data: users, count: 1, limit: 10, page: 0 })
  );
  userServiceMock.deactivateUser.mockReturnValue(of(undefined));
  userServiceMock.reactivateUser.mockReturnValue(of(undefined));
  const confirmDialogMock = { confirm: vi.fn(() => of(true)) };
  // The logged-in admin, who can't deactivate themselves
  const currentUserId = "me";
  // A new one per test, so components from earlier tests don't hold it
  let breakpoints: BehaviorSubject<BreakpointState>;
  // What the socket says changed elsewhere
  const changed = new Subject<ResourceChange>();
  const liveUpdatesMock = { changes: vi.fn(() => changed.asObservable()) };
  const createComponent = createComponentFactory({
    component: ListUsersComponent,
    imports: [
      RouterModule.forRoot([{ path: "users/add", component: MockComponent }]),
    ],
    mocks: [NotificationService],
    providers: [
      provideTranslateService(),
      { provide: LiveUpdatesService, useValue: liveUpdatesMock },
      { provide: UserService, useValue: userServiceMock },
      { provide: ConfirmDialog, useValue: confirmDialogMock },
      {
        provide: CredentialsService,
        useValue: { userId: () => currentUserId },
      },
      {
        provide: BreakpointObserver,
        useFactory: () => ({ observe: () => breakpoints }),
      },
      provideHttpClientTesting(),
    ],
  });

  const returnError = throwError(() => new Error("test error"));

  beforeEach(() => {
    breakpoints = new BehaviorSubject<BreakpointState>({
      matches: false,
      breakpoints: {},
    });
    userServiceMock.getPaginatedUsers.mockClear();
    userServiceMock.deactivateUser.mockClear();
    userServiceMock.reactivateUser.mockClear();
    confirmDialogMock.confirm.mockClear();
    confirmDialogMock.confirm.mockReturnValue(of(true));
    spectator = createComponent();
    httpMock = spectator.inject(HttpTestingController);
    spectator.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it("Should reload when someone else changes the list", () => {
    // Arrange: the list has loaded
    const loads = userServiceMock.getPaginatedUsers.mock.calls.length;
    // Act
    changed.next({ resource: RESOURCE.USERS });
    // Assert
    expect(liveUpdatesMock.changes).toHaveBeenCalledWith(RESOURCE.USERS);
    expect(userServiceMock.getPaginatedUsers).toHaveBeenCalledTimes(loads + 1);
  });

  it("Should list the users", () => {
    // Assert
    expect(spectator.query("h1")).toHaveText("users.list.title");
    expect(spectator.queryAll("tr.mat-mdc-row")).toHaveLength(1);
  });

  const headers = () =>
    spectator
      .queryAll("th.mat-mdc-header-cell")
      .map((header) => header.textContent?.trim());

  it("Should show the email under the name", () => {
    // Assert
    expect(headers()).toEqual([
      "common.name",
      "users.list.role",
      "users.document.label",
      "users.list.status",
      "users.list.lastAccess",
      "common.createdOn",
      "common.actions",
    ]);
    expect(spectator.query(".user-email")).toHaveText("test@example.com");
  });

  it("Should show only the name and role on small screens", () => {
    // Act
    breakpoints.next({ matches: true, breakpoints: {} });
    spectator.detectChanges();
    // Assert
    expect(headers()).toEqual([
      "common.name",
      "users.list.role",
      "common.actions",
    ]);
  });

  it("Should show the role as a chip, and a dash for a missing document", () => {
    // Arrange
    spectator.component.data.data$.next([
      users[0],
      { ...users[0], id: "2", role: ROLE.CLIENT, cpf: "" },
    ]);
    spectator.detectChanges();
    // Assert
    const rows = spectator.queryAll("tr.mat-mdc-row");
    expect(rows[0].querySelector(".chip")).toHaveText("roles.admin");
    expect(rows[1].querySelector(".chip")).toHaveText("roles.client");
    expect(rows[1].querySelector("td.document")).toHaveText("—");
  });

  it("Should show each account's last access, or that it never logged in", () => {
    // Arrange
    const at = "2026-10-20T09:30:00Z";
    spectator.component.data.data$.next([
      { ...users[0], lastAccessAt: at },
      users[0],
    ]);
    spectator.detectChanges();
    // Assert
    const cells = spectator
      .queryAll("td.mat-column-lastAccessAt")
      .map((cell) => cell.textContent?.trim());
    expect(cells).toEqual([
      formatDate(
        at,
        "short",
        spectator.component.locale() ?? spectator.inject(LOCALE_ID)
      ),
      "users.list.neverLoggedIn",
    ]);
  });

  describe("Deactivating and reactivating", () => {
    const show = (shown: UserEntity[]) => {
      spectator.component.data.data$.next(shown);
      spectator.detectChanges();
    };
    const inactive = { ...users[0], id: "2", active: false };

    it("Should show each account's status", () => {
      show([users[0], inactive]);

      const chips = spectator.queryAll("td.mat-column-status .chip");
      expect(chips[0]).toHaveText("users.list.active");
      expect(chips[0]).toHaveClass("chip-success");
      expect(chips[1]).toHaveText("users.list.inactive");
      expect(chips[1]).toHaveClass("chip-error");
    });

    it("Should deactivate an account once confirmed, and reload", () => {
      const refresh = vi.spyOn(spectator.component.data, "refresh");
      show([users[0]]);

      spectator.click("button[name='deactivate']");

      expect(confirmDialogMock.confirm).toHaveBeenCalledWith(
        expect.objectContaining({
          messageParams: { name: "test" },
          destructive: true,
        })
      );
      expect(userServiceMock.deactivateUser).toHaveBeenCalledWith(users[0]);
      expect(
        spectator.inject(NotificationService).success
      ).toHaveBeenCalledWith("users.deactivated");
      expect(refresh).toHaveBeenCalled();
    });

    it("Should not deactivate when the confirmation is cancelled", () => {
      confirmDialogMock.confirm.mockReturnValue(of(false));
      show([users[0]]);

      spectator.click("button[name='deactivate']");

      expect(userServiceMock.deactivateUser).not.toHaveBeenCalled();
    });

    it("Should reactivate an inactive account", () => {
      const refresh = vi.spyOn(spectator.component.data, "refresh");
      show([inactive]);

      expect(spectator.query("button[name='deactivate']")).toBeNull();
      spectator.click("button[name='reactivate']");

      expect(userServiceMock.reactivateUser).toHaveBeenCalledWith(inactive);
      expect(
        spectator.inject(NotificationService).success
      ).toHaveBeenCalledWith("users.reactivated");
      expect(refresh).toHaveBeenCalled();
    });

    it("Should not offer to deactivate the admin's own account", () => {
      show([{ ...users[0], id: currentUserId }]);

      expect(spectator.query("button[name='deactivate']")).toBeNull();
      expect(spectator.query("button[name='reactivate']")).toBeNull();
    });
  });

  it("should call getPaginatedUsers on init", () => {
    // Assert
    expect(userServiceMock.getPaginatedUsers).toHaveBeenCalledTimes(1);
  });

  it("should call getPaginatedUsers on refresh", () => {
    expect(userServiceMock.getPaginatedUsers).toHaveBeenCalledTimes(1);
    userServiceMock.getPaginatedUsers.mockReturnValueOnce(returnError);

    spectator.component.refresh();

    //
    expect(userServiceMock.getPaginatedUsers).toHaveBeenCalledTimes(2);
  });

  it("should call getPaginatedUsers on refresh", () => {
    expect(userServiceMock.getPaginatedUsers).toHaveBeenCalledTimes(1);
    userServiceMock.getPaginatedUsers.mockReturnValueOnce(
      of({ data: [], count: 0, limit: 10, page: 1 })
    );

    spectator.component.refresh();
    //
    expect(userServiceMock.getPaginatedUsers).toHaveBeenCalledTimes(2);
  });

  it('button click should call "goToAddUser"', () => {
    const userClickedSpy = vi.spyOn(spectator.component, "goToAddUser");
    spectator.click("button[name='createUser']");
    expect(userClickedSpy).toHaveBeenCalled();
  });
});

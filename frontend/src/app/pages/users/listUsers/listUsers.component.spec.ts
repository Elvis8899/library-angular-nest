import { BreakpointObserver, BreakpointState } from "@angular/cdk/layout";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { RouterModule } from "@angular/router";
import { ROLE } from "@app/models/credentials.entity";
import { UserEntity } from "@app/models/user.entity";
import { ListUsersComponent } from "@app/pages/users/listUsers/listUsers.component";
import {
  LiveUpdatesService,
  RESOURCE,
  ResourceChange,
} from "@app/services/liveUpdates.service";
import { Logger } from "@app/services/logger.service";
import { UserService } from "@app/services/user.http.service";
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
      createdAt: new Date().toDateString(),
      updatedAt: new Date().toDateString(),
    },
  ];
  const userServiceMock = createSpyObject(UserService);
  userServiceMock.getPaginatedUsers.mockReturnValue(
    of({ data: users, count: 1, limit: 10, page: 0 })
  );
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
    providers: [
      provideTranslateService(),
      { provide: LiveUpdatesService, useValue: liveUpdatesMock },
      { provide: UserService, useValue: userServiceMock },
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
      "common.createdOn",
    ]);
    expect(spectator.query(".user-email")).toHaveText("test@example.com");
  });

  it("Should show only the name and role on small screens", () => {
    // Act
    breakpoints.next({ matches: true, breakpoints: {} });
    spectator.detectChanges();
    // Assert
    expect(headers()).toEqual(["common.name", "users.list.role"]);
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

import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { RouterModule } from "@angular/router";
import { ROLE } from "@app/models/credentials.entity";
import { UserEntity } from "@app/models/user.entity";
import { ListUsersComponent } from "@app/pages/users/listUsers/listUsers.component";
import { Logger } from "@app/services/logger.service";
import { UserService } from "@app/services/user.http.service";
import { MockComponent } from "@app/shared/utils/test/mockComponent";
import {
  createComponentFactory,
  createSpyObject,
  Spectator,
} from "@ngneat/spectator/vitest";
import { TranslateModule } from "@ngx-translate/core";
import { of, throwError } from "rxjs";

Logger.level = 0;

describe("ListUsersComponent", () => {
  let spectator!: Spectator<ListUsersComponent>;
  let httpMock: HttpTestingController;
  const users: UserEntity[] = [
    {
      id: "1",
      name: "test",
      email: "test",
      cpf: "test",
      role: ROLE.ADMIN,
      password: "test",
      createdAt: new Date().toDateString(),
      updatedAt: new Date().toDateString(),
    },
  ];
  const userServiceMock = createSpyObject(UserService);
  userServiceMock.getPaginatedUsers.mockReturnValue(
    of({ data: users, count: 1, limit: 10, page: 0 })
  );
  const createComponent = createComponentFactory({
    component: ListUsersComponent,
    imports: [
      RouterModule.forRoot([{ path: "users/add", component: MockComponent }]),
      TranslateModule.forRoot(),
    ],
    providers: [
      { provide: UserService, useValue: userServiceMock },
      provideHttpClientTesting(),
    ],
  });

  const returnError = throwError(() => new Error("test error"));

  beforeEach(() => {
    userServiceMock.getPaginatedUsers.mockClear();
    spectator = createComponent();
    httpMock = spectator.inject(HttpTestingController);
    spectator.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it("Should list the users", () => {
    // Assert
    expect(spectator.query("h1")).toHaveText("Users List");
    expect(spectator.queryAll("tr.mat-mdc-row")).toHaveLength(1);
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
    expect(rows[0].querySelector(".chip")).toHaveText("Admin");
    expect(rows[1].querySelector(".chip")).toHaveText("Client");
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

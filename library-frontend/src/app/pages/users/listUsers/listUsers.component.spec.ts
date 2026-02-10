import { RouterModule } from "@angular/router";
import { ROLE } from "@app/models/credentials.entity";
import { UserEntity } from "@app/models/user.entity";
import { ListUsersComponent } from "@app/pages/users/listUsers/listUsers.component";
import { Logger } from "@app/services/logger.service";
import { UserService } from "@app/services/user.http.service";
import { createComponentFactory, Spectator } from "@ngneat/spectator/vitest";
import { TranslateModule } from "@ngx-translate/core";
import { of, throwError } from "rxjs";

Logger.level = 0;

describe("ListUsersComponent", () => {
  let spectator!: Spectator<ListUsersComponent>;
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
  const userServiceMock = {
    getPaginatedUsers: vi.fn().mockReturnValue(of({ data: users })),
  };
  const createComponent = createComponentFactory({
    component: ListUsersComponent,
    imports: [
      RouterModule.forRoot([{ path: "users/add", component: class {} }]),
      TranslateModule.forRoot(),
    ],
    providers: [{ provide: UserService, useValue: userServiceMock }],
  });

  const returnError = throwError(() => new Error("test error"));

  beforeEach(() => {
    userServiceMock.getPaginatedUsers.mockClear();
    spectator = createComponent();
  });

  it("Should create app", () => {
    // Assert
    expect(spectator.query("section")).toBeTruthy();
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
    userServiceMock.getPaginatedUsers.mockReturnValueOnce(of({ data: [] }));

    spectator.component.refresh();
    //
    expect(userServiceMock.getPaginatedUsers).toHaveBeenCalledTimes(2);
  });

  // it("should call getPaginatedUsers on refresh", () => {
  //   spectator.detectChanges();

  //   spectator.component.refresh();

  //   const loading = spectator.query(".loading");
  //   expect(loading).toBeTruthy();
  // });

  // it('user click should call "userClicked"', () => {
  //   const userClickedSpy = vi.spyOn(spectator.component, "userClicked");
  //   spectator.click("td");
  //   expect(userClickedSpy).toHaveBeenCalled();
  // });

  it('button click should call "goToAddUser"', () => {
    const userClickedSpy = vi.spyOn(spectator.component, "goToAddUser");
    spectator.click("button");
    expect(userClickedSpy).toHaveBeenCalled();
  });
});

import { provideHttpClientTesting } from "@angular/common/http/testing";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { ROLE } from "@app/models/credentials.entity";
import { UserEntity } from "@app/models/user.entity";
import { ChooseUserDialogComponent } from "@app/pages/books/listBooks/chooseUserDialog/chooseUser.dialog.component";
import { Logger } from "@app/services/logger.service";
import { UserService } from "@app/services/user.http.service";
import {
  createComponentFactory,
  createSpyObject,
  Spectator,
} from "@ngneat/spectator/vitest";
import { noop, of, throwError } from "rxjs";

Logger.level = 0;

describe("ChooseUserDialogComponent", () => {
  let spectator: Spectator<ChooseUserDialogComponent>;
  const users: UserEntity[] = [
    {
      id: "1",
      name: "test",
      email: "test",
      cpf: "test",
      role: ROLE.CLIENT,
      password: "test",
      createdAt: new Date().toDateString(),
      updatedAt: new Date().toDateString(),
    },
  ];
  // const userServiceMock = {
  //   getPaginatedUsers: vi.fn().mockReturnValue(of({ data: users })),
  // };
  const userServiceMock = createSpyObject(UserService);
  userServiceMock.getPaginatedUsers.mockReturnValue(
    of({ data: users, count: 1, limit: 10, page: 0 })
  );

  const matDialogMock = {
    close: vi.fn(noop),
  };

  const createComponent = createComponentFactory({
    component: ChooseUserDialogComponent,
    providers: [
      provideHttpClientTesting(),
      { provide: UserService, useValue: userServiceMock },
      {
        provide: MAT_DIALOG_DATA,
        useValue: { book: {} },
      },
      { provide: MatDialogRef, useValue: matDialogMock },
    ],
  });
  beforeEach(() => {
    matDialogMock.close.mockClear();
  });
  it("should create", () => {
    spectator = createComponent();
    expect(spectator.component).toBeTruthy();
  });

  it("if paginated users fails, should close", () => {
    userServiceMock.getPaginatedUsers.mockReturnValueOnce(
      throwError(() => new Error())
    );
    spectator = createComponent();

    expect(matDialogMock.close).toHaveBeenCalledTimes(1);
  });

  it("should close dialog", () => {
    spectator = createComponent();
    const onNoClickSpy = vi.spyOn(spectator.component, "onNoClick");
    spectator.click('button[name="cancelDialog"]');
    expect(onNoClickSpy).toHaveBeenCalledTimes(1);
    expect(matDialogMock.close).toHaveBeenCalledTimes(1);
  });

  it("should select user", () => {
    spectator = createComponent();
    spectator.click("mat-select");
    spectator.click("mat-option");
    expect(spectator.component.selectUserFormControl.value).equal("1");
    spectator.click('button[name="confirmDialog"]');
    expect(matDialogMock.close).toHaveBeenCalledTimes(1);
  });
});

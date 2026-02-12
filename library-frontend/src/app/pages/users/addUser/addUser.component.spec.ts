import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { RouterModule } from "@angular/router";
import { AddUsersComponent } from "@app/pages/users/addUser/addUser.component";
import { Logger } from "@app/services/logger.service";
import { UserService } from "@app/services/user.http.service";
import { MockComponent } from "@app/shared/utils/test/mockComponent";
import {
  createComponentFactory,
  Spectator,
  SpyObject,
} from "@ngneat/spectator/vitest";
import { TranslateModule } from "@ngx-translate/core";
import { HotToastService } from "@ngxpert/hot-toast";
import { of, throwError } from "rxjs";

Logger.level = 0;

describe("LanguageSelectorComponent", () => {
  let spectator: Spectator<AddUsersComponent>;
  let httpMock: HttpTestingController;
  let inputs: Record<"name" | "email" | "cpf" | "password", HTMLInputElement>;
  let userServiceMock: SpyObject<UserService>;

  const createComponent = createComponentFactory({
    component: AddUsersComponent,
    imports: [
      RouterModule.forRoot([{ path: "users/list", component: MockComponent }]),
      TranslateModule.forRoot(),
    ],

    mocks: [HotToastService, UserService],
    providers: [
      provideHttpClientTesting(),
      /// { provide: UserService, useValue: userServiceMock },
    ],
  });
  beforeEach(() => {
    spectator = createComponent();
    userServiceMock = spectator.inject(UserService);
    userServiceMock.addUser.mockReturnValue(of(undefined));
    httpMock = spectator.inject(HttpTestingController);
    inputs = {
      name: spectator.query("input[name='name']") as HTMLInputElement,
      email: spectator.query("input[name='email']") as HTMLInputElement,
      cpf: spectator.query("input[name='cpf']") as HTMLInputElement,
      password: spectator.query("input[name='password']") as HTMLInputElement,
    };
  });
  afterEach(() => {
    httpMock.verify();
  });

  it("should have subtitle", () => {
    // Assert
    expect(spectator.query("h2")).toContainText("Create User");
  });

  it("should show error if name is invalid", () => {
    spectator.typeInElement("a", inputs.name);
    inputs.email.focus();
    spectator.detectChanges();

    expect(spectator.query(".text-danger")).toContainText("Nome inválido");
  });
  it("should show error if email is invalid", () => {
    spectator.typeInElement("a", inputs.email);
    inputs.name.focus();
    spectator.detectChanges();

    expect(spectator.query(".text-danger")).toContainText("Email inválido");
  });
  it("should show error if cpf is invalid", () => {
    spectator.typeInElement("a", inputs.cpf);
    inputs.email.focus();
    spectator.detectChanges();

    expect(spectator.query(".text-danger")).toContainText("CPF inválido");
  });
  it("should show error if password is invalid", () => {
    spectator.typeInElement("a", inputs.password);
    inputs.email.focus();
    spectator.detectChanges();

    expect(spectator.query(".text-danger")).toContainText("Senha inválida");
  });

  it("Should add user if form is valid", () => {
    spectator.typeInElement("João da Silva", inputs.name);
    spectator.typeInElement("senha123", inputs.password);
    spectator.typeInElement("sV7nI@example.com", inputs.email);
    spectator.typeInElement("12345678901", inputs.cpf);
    const toastService = spectator.inject(HotToastService);

    spectator.detectChanges();
    expect(spectator.query("button")).not.toBeDisabled();
    spectator.click("button");

    expect(userServiceMock.addUser).toHaveBeenCalledTimes(1);
    expect(toastService.success).toHaveBeenCalledTimes(1);
  });

  it("Should show error if form is valid, but addUser returns error", () => {
    spectator.typeInElement("João da Silva", inputs.name);
    spectator.typeInElement("senha123", inputs.password);
    spectator.typeInElement("sV7nI@example.com", inputs.email);
    spectator.typeInElement("12345678901", inputs.cpf);
    const toastService = spectator.inject(HotToastService);

    userServiceMock.addUser.mockReturnValueOnce(throwError(() => new Error()));
    spectator.detectChanges();
    expect(spectator.query("button")).not.toBeDisabled();
    spectator.click("button");

    expect(userServiceMock.addUser).toHaveBeenCalledTimes(1);
    expect(toastService.error).toHaveBeenCalledTimes(1);
  });
});

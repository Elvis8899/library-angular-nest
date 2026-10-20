import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { Router, RouterModule } from "@angular/router";
import { ROLE } from "@app/models/credentials.entity";
import { AddUsersComponent } from "@app/pages/users/addUser/addUser.component";
import { Logger } from "@app/services/logger.service";
import { NotificationService } from "@app/services/notification.service";
import { UserService } from "@app/services/user.http.service";
import { MockComponent } from "@app/shared/utils/test/mockComponent";
import { provideTranslateService } from "@ngx-translate/core";
import {
  createComponentFactory,
  Spectator,
  SpyObject,
} from "@openng/spectator/vitest";
import { of, Subject, throwError } from "rxjs";

Logger.level = 0;

describe("AddUsersComponent", () => {
  let spectator: Spectator<AddUsersComponent>;
  let httpMock: HttpTestingController;
  let inputs: Record<"name" | "email" | "cpf" | "password", HTMLInputElement>;
  let userServiceMock: SpyObject<UserService>;

  const createComponent = createComponentFactory({
    component: AddUsersComponent,
    imports: [
      RouterModule.forRoot([{ path: "users/list", component: MockComponent }]),
    ],
    mocks: [NotificationService, UserService],
    providers: [provideTranslateService(), provideHttpClientTesting()],
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

  function fillIn(cpf = "529.982.247-25") {
    spectator.typeInElement("João da Silva", inputs.name);
    spectator.typeInElement("joao@example.com", inputs.email);
    spectator.typeInElement(cpf, inputs.cpf);
    spectator.typeInElement("senha123", inputs.password);
  }

  const errorTexts = () =>
    spectator.queryAll("mat-error").map((error) => error.textContent?.trim());

  it("Should have a title", () => {
    // Assert
    expect(spectator.query("h1")).toHaveText("users.create");
  });

  it("Should add the user as a client and go back to the list", () => {
    // Arrange
    const navigateSpy = vi.spyOn(spectator.inject(Router), "navigate");
    const notifications = spectator.inject(NotificationService);
    fillIn();
    // Act
    spectator.click("button[name='save']");
    // Assert
    expect(userServiceMock.addUser).toHaveBeenCalledExactlyOnceWith({
      name: "João da Silva",
      email: "joao@example.com",
      cpf: "529.982.247-25",
      password: "senha123",
      role: ROLE.CLIENT,
    });
    expect(notifications.success).toHaveBeenCalledTimes(1);
    expect(navigateSpy).toHaveBeenCalledWith(["/users/list"]);
  });

  it("Should accept an alphanumeric CNPJ", () => {
    // Arrange
    fillIn("12.ABC.345/01DE-35");
    // Act
    spectator.click("button[name='save']");
    // Assert
    expect(userServiceMock.addUser).toHaveBeenCalledTimes(1);
  });

  it("Should show the error when adding fails", () => {
    // Arrange
    const notifications = spectator.inject(NotificationService);
    userServiceMock.addUser.mockReturnValueOnce(
      throwError(() => new Error("Email já cadastrado"))
    );
    fillIn();
    // Act
    spectator.click("button[name='save']");
    // Assert
    expect(notifications.errorMessage).toHaveBeenCalledExactlyOnceWith(
      "Email já cadastrado"
    );
    expect(spectator.component.saving()).toBe(false);
  });

  it("Should show the errors and not save when submitted empty", () => {
    // Act
    spectator.click("button[name='save']");
    // Assert
    expect(userServiceMock.addUser).not.toHaveBeenCalled();
    expect(errorTexts()).toEqual([
      "validation.name.required",
      "validation.email.required",
      "users.document.required",
      "users.form.passwordHint",
    ]);
  });

  it("Should reject an invalid email, document and short password", () => {
    // Arrange
    spectator.typeInElement("João", inputs.name);
    spectator.typeInElement("not an email", inputs.email);
    spectator.typeInElement("529.982.247-26", inputs.cpf);
    spectator.typeInElement("abc", inputs.password);
    // Act
    spectator.click("button[name='save']");
    // Assert
    expect(userServiceMock.addUser).not.toHaveBeenCalled();
    expect(errorTexts()).toEqual([
      "validation.email.invalid",
      "users.document.invalid",
      "users.form.passwordHint",
    ]);
  });

  it("Should show and hide the password", () => {
    // Act
    spectator.click("button[name='togglePassword']");
    // Assert
    expect(inputs.password).toHaveAttribute("type", "text");
    expect(spectator.query("button[name='togglePassword']")).toHaveAttribute(
      "aria-label",
      "auth.password.hide"
    );
    // Act
    spectator.click("button[name='togglePassword']");
    // Assert
    expect(inputs.password).toHaveAttribute("type", "password");
  });

  it("Should show a spinner and ignore new submits while saving", () => {
    // Arrange
    const response = new Subject<void>();
    userServiceMock.addUser.mockReturnValueOnce(response);
    fillIn();
    // Act
    spectator.click("button[name='save']");
    spectator.component.onSubmit();
    // Assert
    expect(userServiceMock.addUser).toHaveBeenCalledTimes(1);
    expect(spectator.query("button[name='save']")).toBeDisabled();
    expect(spectator.query("mat-progress-spinner")).toBeTruthy();
    // Act
    response.complete();
    spectator.detectChanges();
    // Assert
    expect(spectator.query("button[name='save']")).not.toBeDisabled();
  });

  it("Should link Cancel to the list", () => {
    // Assert
    expect(spectator.query("a[name='cancel']")).toHaveAttribute(
      "href",
      "/users/list"
    );
  });
});

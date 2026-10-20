import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { Router, RouterModule } from "@angular/router";
import { Credentials, ROLE } from "@app/models/credentials.entity";
import { LoginComponent } from "@app/pages/auth/login/login.component";
import { AuthenticationService } from "@app/services/authentication.service";
import { Logger } from "@app/services/logger.service";
import { NotificationService } from "@app/services/notification.service";
import { MockComponent } from "@app/shared/utils/test/mockComponent";
import { TranslateModule } from "@ngx-translate/core";
import {
  createComponentFactory,
  createSpyObject,
  Spectator,
} from "@openng/spectator/vitest";
import { of, Subject, throwError } from "rxjs";

Logger.level = 0;

// The language selector loads the default language, pt-BR, unless another
// spec left a language in localStorage (cleared before each test)
describe("LoginComponent", () => {
  let spectator: Spectator<LoginComponent>;
  let httpMock: HttpTestingController;
  const credential: Credentials = {
    accessToken: "string",
    refreshToken: "string",
    user: {
      id: "id",
      name: "name",
      email: "email",
      role: ROLE.ADMIN,
    },
  };
  const authenticationServiceMock = createSpyObject(AuthenticationService);
  authenticationServiceMock.login.mockReturnValue(of(credential));

  let inputs: Record<"email" | "password", HTMLInputElement>;
  const createComponent = createComponentFactory({
    component: LoginComponent,
    imports: [
      RouterModule.forRoot([
        { path: "books", component: MockComponent },
        { path: "users/list", component: MockComponent },
      ]),
      TranslateModule.forRoot(),
    ],
    providers: [
      provideHttpClientTesting(),
      { provide: AuthenticationService, useValue: authenticationServiceMock },
    ],
    mocks: [NotificationService],
  });

  beforeEach(() => {
    localStorage.removeItem("language");
    spectator = createComponent();
    httpMock = spectator.inject(HttpTestingController);
    authenticationServiceMock.login.mockClear();
    inputs = {
      email: spectator.query("input[name='email']") as HTMLInputElement,
      password: spectator.query("input[name='password']") as HTMLInputElement,
    };
  });
  afterEach(() => {
    httpMock.verify();
  });
  function fillIn(email: string, password: string) {
    spectator.typeInElement(email, inputs.email);
    spectator.typeInElement(password, inputs.password);
  }

  it("Should have a title", () => {
    // Assert
    expect(spectator.query("h1")).toHaveText("Login");
  });

  it("If user inputs correct credentials, should login and open the role's page", () => {
    // Arrange
    const router = spectator.inject(Router);
    const navigateSpy = vi.spyOn(router, "navigate");
    fillIn("admin@admin.com", "p");
    // Act
    spectator.click("button[name='login']");
    // Assert
    expect(authenticationServiceMock.login).toHaveBeenCalledExactlyOnceWith({
      email: "admin@admin.com",
      password: "p",
    });
    expect(navigateSpy).toHaveBeenCalledWith(["/users/list"], {
      replaceUrl: true,
    });
    expect(spectator.component.loading()).toBe(false);
  });

  it("If user inputs incorrect credentials, should give message", () => {
    // Arrange
    fillIn("admin@admin.com", "password");
    const notifications = spectator.inject(NotificationService);
    authenticationServiceMock.login.mockReturnValueOnce(
      throwError(() => new Error("message"))
    );
    // Act
    spectator.click("button[name='login']");
    // Assert
    expect(authenticationServiceMock.login).toHaveBeenCalledTimes(1);
    expect(notifications.errorMessage).toHaveBeenCalledExactlyOnceWith(
      "message"
    );
    expect(spectator.component.loading()).toBe(false);
  });

  it("Should show the API's message when there is one", () => {
    // Arrange
    fillIn("admin@admin.com", "password");
    const notifications = spectator.inject(NotificationService);
    authenticationServiceMock.login.mockReturnValueOnce(
      throwError(() => ({ error: { message: "Credenciais inválidas" } }))
    );
    // Act
    spectator.click("button[name='login']");
    // Assert
    expect(notifications.errorMessage).toHaveBeenCalledWith(
      "Credenciais inválidas"
    );
  });

  it("Should show the errors and not login when submitted empty", () => {
    // Act
    spectator.click("button[name='login']");
    // Assert
    expect(authenticationServiceMock.login).not.toHaveBeenCalled();
    const errors = spectator.queryAll("mat-error");
    expect(errors[0]).toHaveText("Informe o email");
    expect(errors[1]).toHaveText("Informe a senha");
  });

  it("Should ask for a valid email", () => {
    // Arrange
    fillIn("not an email", "password");
    // Act
    spectator.click("button[name='login']");
    // Assert
    expect(authenticationServiceMock.login).not.toHaveBeenCalled();
    expect(spectator.query("mat-error")).toHaveText("Informe um email válido");
  });

  it("Should show and hide the password", () => {
    // Assert
    expect(inputs.password).toHaveAttribute("type", "password");
    // Act
    spectator.click("button[name='togglePassword']");
    // Assert
    expect(inputs.password).toHaveAttribute("type", "text");
    expect(spectator.query("button[name='togglePassword']")).toHaveAttribute(
      "aria-label",
      "Esconder senha"
    );
    // Act
    spectator.click("button[name='togglePassword']");
    // Assert
    expect(inputs.password).toHaveAttribute("type", "password");
  });

  it("Should show a spinner and ignore new submits while logging in", () => {
    // Arrange
    const response = new Subject<Credentials>();
    authenticationServiceMock.login.mockReturnValueOnce(response);
    fillIn("admin@admin.com", "password");
    // Act
    spectator.click("button[name='login']");
    // Assert
    expect(spectator.query("button[name='login']")).toBeDisabled();
    expect(spectator.query("mat-progress-spinner")).toBeTruthy();
    // Act: Enter in a field submits the form even with the button disabled
    spectator.component.login();
    // Assert
    expect(authenticationServiceMock.login).toHaveBeenCalledTimes(1);
    // Act
    response.next(credential);
    response.complete();
    spectator.detectChanges();
    // Assert
    expect(spectator.query("button[name='login']")).not.toBeDisabled();
    expect(spectator.query("mat-progress-spinner")).toBeNull();
  });
});

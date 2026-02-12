import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { RouterModule } from "@angular/router";
import { Credentials, ROLE } from "@app/models/credentials.entity";
import { LoginComponent } from "@app/pages/auth/login/login.component";
import { AuthenticationService } from "@app/services/authentication.service";
import { Logger } from "@app/services/logger.service";
import { MockComponent } from "@app/shared/utils/test/mockComponent";
import {
  createComponentFactory,
  createSpyObject,
  Spectator,
} from "@ngneat/spectator/vitest";
import { TranslateModule } from "@ngx-translate/core";
import { HotToastService } from "@ngxpert/hot-toast";
import { of, throwError } from "rxjs";

Logger.level = 0;

describe("LanguageSelectorComponent", () => {
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
    mocks: [HotToastService],
  });

  beforeEach(() => {
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
  it("should have Login subtitle", () => {
    // Assert
    expect(spectator.query("h2")).toContainText("Login");
  });

  it("If user inputs correct credentials, should login", () => {
    spectator.typeInElement("admin@admin.com", inputs.email);
    spectator.typeInElement("password", inputs.password);
    spectator.detectChanges();
    expect(spectator.query("button")).not.toBeDisabled();
    spectator.click("button");
    expect(authenticationServiceMock.login).toHaveBeenCalledTimes(1);
  });

  it("If user inputs incorrect credentials, should give message", () => {
    spectator.typeInElement("admin@admin.com", inputs.email);
    spectator.typeInElement("password", inputs.password);
    const toastService = spectator.inject(HotToastService);
    authenticationServiceMock.login.mockReturnValueOnce(
      throwError(() => new Error("message"))
    );

    spectator.detectChanges();
    expect(spectator.query("button")).not.toBeDisabled();
    spectator.click("button");
    expect(authenticationServiceMock.login).toHaveBeenCalledTimes(1);
    expect(toastService.error).toBeCalledTimes(1);
  });

  it("Should show error messages if inputs are invalid", () => {
    spectator.typeInElement("not an email", inputs.email);
    spectator.typeInElement("p", inputs.password);

    inputs.email.focus();
    spectator.detectChanges();

    expect(spectator.query("button")).toBeDisabled();
    expect(spectator.query(".input-field")).toHaveText("Email is required");
    expect(spectator.queryLast(".input-field")).toHaveText(
      "Password is required"
    );
  });
});

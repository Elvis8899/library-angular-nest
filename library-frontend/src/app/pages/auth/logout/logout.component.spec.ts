import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { RouterModule } from "@angular/router";
import { LogoutComponent } from "@app/pages/auth/logout/logout.component";
import { AuthenticationService } from "@app/services/authentication.service";
import { Logger } from "@app/services/logger.service";
import { MockComponent } from "@app/shared/utils/test/mockComponent";
import {
  createComponentFactory,
  createSpyObject,
  Spectator,
} from "@ngneat/spectator/vitest";
import { TranslateModule } from "@ngx-translate/core";
import { of, throwError } from "rxjs";

Logger.level = 0;

describe("LanguageSelectorComponent", () => {
  const authServiceMock = createSpyObject(AuthenticationService);
  authServiceMock.logout.mockReturnValue(of(true));
  let httpMock: HttpTestingController;
  let spectator: Spectator<LogoutComponent>;
  const createComponent = createComponentFactory({
    component: LogoutComponent,
    imports: [
      RouterModule.forRoot([{ path: "login", component: MockComponent }]),
      TranslateModule.forRoot(),
    ],
    providers: [
      provideHttpClientTesting(),
      { provide: AuthenticationService, useValue: authServiceMock },
    ],
  });

  // beforeEach(() => {
  // });

  afterEach(() => {
    httpMock.verify();
    authServiceMock.logout.mockClear();
  });

  it("Should be created", () => {
    spectator = createComponent();
    httpMock = spectator.inject(HttpTestingController);
    // Assert
    //expect(authServiceMock.logout).toHaveBeenCalledTimes(1);
    expect(spectator.query("p")).toContainText("Logged Out!");
  });

  it("If error on logout, should log error", () => {
    authServiceMock.logout.mockReturnValueOnce(
      throwError(() => new Error("test error"))
    );
    spectator = createComponent();
    httpMock = spectator.inject(HttpTestingController);
    // Arrange

    // Act
    // Assert
    expect(authServiceMock.logout).toHaveBeenCalledTimes(1);
    //expect(spectator.query("p")).toContainText("Error logging out");
  });
});

import { Router, RouterModule } from "@angular/router";
import { LogoutComponent } from "@app/pages/auth/logout/logout.component";
import { AuthenticationService } from "@app/services/authentication.service";
import { Logger } from "@app/services/logger.service";
import { MockComponent } from "@app/shared/utils/test/mockComponent";
import { TranslateModule } from "@ngx-translate/core";
import {
  createComponentFactory,
  createSpyObject,
  Spectator,
} from "@openng/spectator/vitest";
import { of, Subject, throwError } from "rxjs";

Logger.level = 0;

describe("LogoutComponent", () => {
  const authServiceMock = createSpyObject(AuthenticationService);
  let spectator: Spectator<LogoutComponent>;
  const createComponent = createComponentFactory({
    component: LogoutComponent,
    imports: [
      RouterModule.forRoot([{ path: "login", component: MockComponent }]),
      TranslateModule.forRoot(),
    ],
    providers: [{ provide: AuthenticationService, useValue: authServiceMock }],
    detectChanges: false,
  });

  function create() {
    spectator = createComponent();
    const navigateSpy = vi.spyOn(spectator.inject(Router), "navigate");
    spectator.detectChanges();
    return navigateSpy;
  }

  beforeEach(() => {
    authServiceMock.logout.mockReset();
    authServiceMock.logout.mockReturnValue(of(true));
  });

  it("Should show a spinner while logging out", () => {
    // Arrange
    authServiceMock.logout.mockReturnValue(new Subject<boolean>());
    // Act
    const navigateSpy = create();
    // Assert
    expect(spectator.query("mat-progress-spinner")).toBeTruthy();
    expect(spectator.query("p")).toHaveText("auth.logout.inProgress");
    expect(spectator.query("main")).toHaveAttribute("role", "status");
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it("Should go to the login page once logged out", () => {
    // Act
    const navigateSpy = create();
    // Assert
    expect(authServiceMock.logout).toHaveBeenCalledTimes(1);
    expect(navigateSpy).toHaveBeenCalledWith(["/login"]);
  });

  it("Should go to the login page even if logging out fails", () => {
    // Arrange
    authServiceMock.logout.mockReturnValue(
      throwError(() => new Error("test error"))
    );
    // Act
    const navigateSpy = create();
    // Assert
    expect(navigateSpy).toHaveBeenCalledWith(["/login"]);
  });
});

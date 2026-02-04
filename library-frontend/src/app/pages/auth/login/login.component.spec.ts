import { RouterModule } from "@angular/router";
import { LoginComponent } from "@app/pages/auth/login/login.component";
import { Logger } from "@app/services/logger.service";
import { Spectator } from "@ngneat/spectator";
import { createComponentFactory } from "@ngneat/spectator/vitest";
import { TranslateModule } from "@ngx-translate/core";

Logger.level = 0;

class LoginMock {}

describe("LanguageSelectorComponent", () => {
  let spectator: Spectator<LoginComponent>;
  const createComponent = createComponentFactory({
    component: LoginComponent,
    imports: [
      RouterModule.forRoot([{ path: "login", component: LoginMock }]),
      TranslateModule.forRoot(),
    ],
  });

  beforeEach(() => (spectator = createComponent()));

  it("should have Login subtitle", () => {
    // Assert
    expect(spectator.query("h2")).toContainText("Login");
  });
});

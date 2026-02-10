import { RouterModule } from "@angular/router";
import { LogoutComponent } from "@app/pages/auth/logout/logout.component";
import { Logger } from "@app/services/logger.service";
import { createComponentFactory, Spectator } from "@ngneat/spectator/vitest";
import { TranslateModule } from "@ngx-translate/core";

Logger.level = 0;

class LoginMock {}

describe("LanguageSelectorComponent", () => {
  let spectator: Spectator<LogoutComponent>;
  const createComponent = createComponentFactory({
    component: LogoutComponent,
    imports: [
      RouterModule.forRoot([{ path: "login", component: LoginMock }]),
      TranslateModule.forRoot(),
    ],
  });

  beforeEach(() => (spectator = createComponent()));

  it("Should be created", () => {
    // Assert
    expect(spectator.query("p")).toContainText("Logged Out!");
  });
});

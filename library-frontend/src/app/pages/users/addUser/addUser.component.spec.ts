import { RouterModule } from "@angular/router";
import { AddUsersComponent } from "@app/pages/users/addUser/addUser.component";
import { Logger } from "@app/services/logger.service";
import { Spectator } from "@ngneat/spectator";
import { createComponentFactory } from "@ngneat/spectator/vitest";
import { TranslateModule } from "@ngx-translate/core";

Logger.level = 0;

class LoginMock {}

describe("LanguageSelectorComponent", () => {
  let spectator: Spectator<AddUsersComponent>;
  const createComponent = createComponentFactory({
    component: AddUsersComponent,
    imports: [
      RouterModule.forRoot([{ path: "login", component: LoginMock }]),
      TranslateModule.forRoot(),
    ],
  });

  beforeEach(() => (spectator = createComponent()));

  it("should have subtitle", () => {
    // Assert
    expect(spectator.query("h2")).toContainText("Create User");
  });
});

import { RouterModule } from "@angular/router";
import { ListRentalsComponent } from "@app/pages/rentals/listRentals/listRentals.component";
import { Logger } from "@app/services/logger.service";
import { Spectator } from "@ngneat/spectator";
import { createComponentFactory } from "@ngneat/spectator/vitest";
import { TranslateModule } from "@ngx-translate/core";

Logger.level = 0;

class LoginMock {}

describe("LanguageSelectorComponent", () => {
  let spectator: Spectator<ListRentalsComponent>;
  const createComponent = createComponentFactory({
    component: ListRentalsComponent,
    imports: [
      RouterModule.forRoot([{ path: "login", component: LoginMock }]),
      TranslateModule.forRoot(),
    ],
  });

  beforeEach(() => (spectator = createComponent()));

  it("should have subtitle", () => {
    // Assert
    expect(spectator.query("h2")).toContainText("Rentals");
  });
});

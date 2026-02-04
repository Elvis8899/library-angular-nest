import { RouterModule } from "@angular/router";
import { ListBooksComponent } from "@app/pages/books/listBooks/listBooks.component";
import { Logger } from "@app/services/logger.service";
import { Spectator } from "@ngneat/spectator";
import { createComponentFactory } from "@ngneat/spectator/vitest";
import { TranslateModule } from "@ngx-translate/core";

Logger.level = 0;

class LoginMock {}

describe("LanguageSelectorComponent", () => {
  let spectator: Spectator<ListBooksComponent>;
  const createComponent = createComponentFactory({
    component: ListBooksComponent,
    imports: [
      RouterModule.forRoot([{ path: "login", component: LoginMock }]),
      TranslateModule.forRoot(),
    ],
  });

  beforeEach(() => (spectator = createComponent()));

  it("should have subtitle", () => {
    // Assert
    expect(spectator.query("h2")).toContainText("Books List");
  });
});

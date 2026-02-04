import { RouterModule } from "@angular/router";
import { AddBooksComponent } from "@app/pages/books/addBook/addBook.component";
import { Logger } from "@app/services/logger.service";
import { Spectator } from "@ngneat/spectator";
import { createComponentFactory } from "@ngneat/spectator/vitest";
import { TranslateModule } from "@ngx-translate/core";

Logger.level = 0;

describe("LanguageSelectorComponent", () => {
  let spectator: Spectator<AddBooksComponent>;
  const createComponent = createComponentFactory({
    component: AddBooksComponent,
    imports: [RouterModule.forRoot([]), TranslateModule.forRoot()],
  });

  beforeEach(() => (spectator = createComponent()));

  it("should not have overlay class by default", () => {
    // Assert
    expect(spectator.query("div")).toHaveClass("add-book-wrapper");
  });
});

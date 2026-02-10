import { withInterceptorsFromDi } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { RouterModule } from "@angular/router";
import { ListBooksComponent } from "@app/pages/books/listBooks/listBooks.component";
import { Logger } from "@app/services/logger.service";
import { createComponentFactory, Spectator } from "@ngneat/spectator/vitest";
import { TranslateModule } from "@ngx-translate/core";

Logger.level = 0;

describe("LanguageSelectorComponent", () => {
  let spectator: Spectator<ListBooksComponent>;
  const createComponent = createComponentFactory({
    component: ListBooksComponent,
    imports: [RouterModule.forRoot([]), TranslateModule.forRoot()],
    providers: [withInterceptorsFromDi(), provideHttpClientTesting()],
  });

  beforeEach(() => (spectator = createComponent()));

  it("should have subtitle", () => {
    // Assert
    expect(spectator.query("h2")).toContainText("Books List");
  });
});

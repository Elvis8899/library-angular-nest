import { RouterModule } from "@angular/router";
import { HeaderComponent } from "@app/layouts/components/header/header.component";
import { Logger } from "@app/services/logger.service";
import { createComponentFactory, Spectator } from "@ngneat/spectator/vitest";
import { TranslateModule } from "@ngx-translate/core";

Logger.level = 0;

describe("HeaderComponent", () => {
  let spectator: Spectator<HeaderComponent>;
  const createComponent = createComponentFactory({
    component: HeaderComponent,
    imports: [RouterModule.forRoot([]), TranslateModule.forRoot()],
  });

  beforeEach(() => (spectator = createComponent()));

  it("Should show the theme toggle and the language selector", () => {
    // Assert
    expect(spectator.query("app-theme-toggle")).toBeTruthy();
    expect(spectator.query("app-language-selector")).toBeTruthy();
  });
});

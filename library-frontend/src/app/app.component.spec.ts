/// <reference types="@angular/localize" />
import { RouterModule } from "@angular/router";
import { AppComponent } from "@app/app.component";
import { Logger } from "@app/services/logger.service";
import { createComponentFactory, Spectator } from "@ngneat/spectator/vitest";
import { TranslateModule } from "@ngx-translate/core";

Logger.level = 0;

describe("AppComponent", () => {
  let spectator: Spectator<AppComponent>;
  const createComponent = createComponentFactory({
    component: AppComponent,
    imports: [RouterModule.forRoot([]), TranslateModule.forRoot()],
  });

  beforeEach(() => (spectator = createComponent()));

  it("Should create app", () => {
    // Assert
    expect(spectator.query("router-outlet")).toBeTruthy();
  });
});

/// <reference types="@angular/localize" />
import { RouterModule } from "@angular/router";
import { AppComponent } from "@app/app.component";
import { Logger } from "@app/services/logger.service";
import { TranslateModule } from "@ngx-translate/core";
import { createComponentFactory, Spectator } from "@openng/spectator/vitest";

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

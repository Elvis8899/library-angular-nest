import { RouterModule } from "@angular/router";
import { LayoutComponent } from "@app/layouts/layout.component";
import { Logger } from "@app/services/logger.service";
import { createComponentFactory, Spectator } from "@ngneat/spectator/vitest";
import { TranslateModule } from "@ngx-translate/core";

Logger.level = 0;

describe("LayoutComponent", () => {
  let spectator: Spectator<LayoutComponent>;
  const createComponent = createComponentFactory({
    component: LayoutComponent,
    imports: [RouterModule.forRoot([]), TranslateModule.forRoot()],
  });

  beforeEach(() => (spectator = createComponent()));

  it("should not have overlay class by default", () => {
    // Assert
    expect(spectator.query("div")).not.toHaveClass("overlay");
  });

  it("should have a overlay class on isSidebarActive", () => {
    // Arrange
    spectator.component.sidebarToggle(true);
    spectator.detectChanges();
    // Assert
    expect(spectator.query("div")).toHaveClass("overlay");
  });
});

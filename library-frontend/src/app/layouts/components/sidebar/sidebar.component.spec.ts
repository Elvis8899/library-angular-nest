import { NavigationEnd, Router, RouterModule } from "@angular/router";
import { SidebarComponent } from "@app/layouts/components/sidebar/sidebar.component";
import { Logger } from "@app/services/logger.service";
import { Spectator } from "@ngneat/spectator";
import { createComponentFactory } from "@ngneat/spectator/vitest";
import { Subject } from "rxjs";

Logger.level = 0;

describe("LanguageSelectorComponent", () => {
  let spectator: Spectator<SidebarComponent>;
  const createComponent = createComponentFactory({
    component: SidebarComponent,
    imports: [RouterModule.forRoot([])],
  });

  beforeEach(() => (spectator = createComponent()));

  it("should have a success class by default", () => {
    // Assert
    expect(spectator.query("nav")).toHaveClass("pb");
  });

  it("should expand on click", () => {
    // Arrange
    const toggleSpy = vi.spyOn(spectator.component, "toggleSidebar");
    // Act
    spectator.click(".toggle-icon");
    // Assert
    expect(spectator.query("nav")).toHaveClass("squeeze");
    expect(toggleSpy).toHaveBeenCalledOnce();
  });

  it("should close back on second click", () => {
    // Arrange
    const toggleSpy = vi.spyOn(spectator.component, "toggleSidebar");
    // Act
    spectator.click(".toggle-icon");
    spectator.click(".toggle-icon");
    // Assert
    expect(spectator.query("nav")).toHaveClass("pb");
    expect(toggleSpy).toHaveBeenCalledTimes(2);
  });

  it("Pipe should be activated on Router NavigationEnd", () => {
    // Arrange
    const spy = vi.spyOn(spectator.component, "activeNavTab");
    const router = spectator.inject(Router);
    const event = new NavigationEnd(1703, `/book/list`, "/");
    // Act
    (router.events as unknown as Subject<Event>).next(
      event as unknown as Event
    );
    // Assert
    expect(spy).toHaveBeenCalled();
  });
});

import { NavigationEnd, Router, RouterModule } from "@angular/router";
import { SidebarComponent } from "@app/layouts/components/sidebar/sidebar.component";
import { CredentialsService } from "@app/services/credentials.service";
import { Logger } from "@app/services/logger.service";
import { MockComponent } from "@app/shared/utils/test/mockComponent";
import { createComponentFactory, Spectator } from "@ngneat/spectator/vitest";
import { TranslateService } from "@ngx-translate/core";
import { of, Subject } from "rxjs";

Logger.level = 0;
const translateServiceMock = {
  addLangs: vi.fn(),
  setDefaultLang: vi.fn().mockReturnValue(of("da")),
  use: vi.fn().mockReturnValue(of("da")),
  getLangs: vi.fn().mockReturnValue(["da", "en"]),
  get: vi.fn().mockReturnValue(of("translated text")),
  instant: vi.fn((key: string) => key),
  onLangChange: of({ lang: "en" }),
  // add the following 2 lines
  onTranslationChange: of(),
  onDefaultLangChange: of(),
  onFallbackLangChange: of(),
  setFallbackLang: of(),
  getParsedResult: of(),
  getStreamOnTranslationChange: of(),
  stream: of(),
  reloadLang: of(),
};

describe("LanguageSelectorComponent", () => {
  let spectator: Spectator<SidebarComponent>;
  const createComponent = createComponentFactory({
    component: SidebarComponent,
    imports: [
      RouterModule.forRoot([{ path: "users", component: MockComponent }]),
    ],
    mocks: [CredentialsService],
    providers: [{ provide: TranslateService, useValue: translateServiceMock }],
  });

  beforeEach(() => {
    spectator = createComponent();
    const credentialsService = spectator.inject(CredentialsService);

    credentialsService.hasRole.mockReturnValue(true);
    credentialsService.hasPermission.mockReturnValue(true);
  });

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

  it("should activate item", () => {
    // Arrange
    spectator.click(".toggle-icon");
    const spy = vi.spyOn(spectator.component, "activateSidebarItem");
    // Act
    spectator.click(".menu-item");
    // Assert
    expect(spy).toHaveBeenCalled();
  });
});

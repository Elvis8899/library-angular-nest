import { SwUpdate, VersionEvent } from "@angular/service-worker";
import { Logger } from "@app/services/logger.service";
import {
  AppUpdateService,
  UpdateComponent,
} from "@app/services/update.service";
import {
  createComponentFactory,
  createServiceFactory,
  createSpyObject,
  SpectatorService,
  SpyObject,
} from "@ngneat/spectator/vitest";
import { HotToastRef, HotToastService } from "@ngxpert/hot-toast";
import { Subject } from "rxjs";

Logger.level = 0;

const versionDetected: VersionEvent = {
  type: "VERSION_DETECTED",
  version: { hash: "1.0.1" },
};
const versionReady: VersionEvent = {
  type: "VERSION_READY",
  currentVersion: { hash: "1.0.0" },
  latestVersion: { hash: "1.0.1" },
};
const installationFailed: VersionEvent = {
  type: "VERSION_INSTALLATION_FAILED",
  version: { hash: "1.0.1" },
  error: "disk full",
};

describe("Update Service", () => {
  let spectator: SpectatorService<AppUpdateService>;
  let swSpy: SpyObject<SwUpdate>;
  let versionUpdates: Subject<VersionEvent>;
  let toastClosed: Subject<{ dismissedByAction: boolean }>;

  const createService = createServiceFactory({
    service: AppUpdateService,
    providers: [{ provide: SwUpdate, useFactory: () => swSpy }],
    mocks: [HotToastService],
  });

  const setup = (isEnabled = true) => {
    versionUpdates = new Subject<VersionEvent>();
    swSpy = createSpyObject(SwUpdate, { isEnabled, versionUpdates });
    swSpy.checkForUpdate.mockResolvedValue(false);
    swSpy.activateUpdate.mockResolvedValue(true);
    spectator = createService();

    toastClosed = new Subject();
    const toastService = spectator.inject(HotToastService);
    toastService.show.mockReturnValue({
      afterClosed: toastClosed,
    } as unknown as ReturnType<HotToastService["show"]>);
    return toastService;
  };

  describe("Checking for updates", () => {
    it("Should check for updates once the app is stable", () => {
      setup();

      expect(swSpy.checkForUpdate).toHaveBeenCalledTimes(1);
    });

    it("Should not check for updates when the service worker is disabled", () => {
      setup(false);

      expect(swSpy.checkForUpdate).not.toHaveBeenCalled();
    });

    it("Should keep running when checking for updates fails", async () => {
      setup();
      swSpy.checkForUpdate.mockRejectedValueOnce(new Error("offline"));

      await expect(spectator.service.updateCheck()).resolves.toBeUndefined();
    });

    it("Should report when an update was found", async () => {
      setup();
      swSpy.checkForUpdate.mockResolvedValueOnce(true);

      await spectator.service.updateCheck();

      expect(swSpy.checkForUpdate).toHaveBeenCalledTimes(2);
    });
  });

  describe("Version events", () => {
    it("Should not show the toast while a new version is downloading", () => {
      const toastService = setup();

      versionUpdates.next(versionDetected);

      expect(toastService.show).not.toHaveBeenCalled();
    });

    it("Should not show the toast when the installation failed", () => {
      const toastService = setup();

      versionUpdates.next(installationFailed);

      expect(toastService.show).not.toHaveBeenCalled();
    });

    it("Should show the update toast when a new version is ready", () => {
      const toastService = setup();

      versionUpdates.next(versionReady);

      expect(toastService.show).toHaveBeenCalledOnce();
      expect(toastService.show).toHaveBeenCalledWith(UpdateComponent, {
        autoClose: false,
        dismissible: false,
      });
    });

    it("Should show the toast only once while it is open", () => {
      const toastService = setup();

      versionUpdates.next(versionReady);
      versionUpdates.next(versionReady);

      expect(toastService.show).toHaveBeenCalledOnce();
    });

    it("Should show the toast again after it was closed", () => {
      const toastService = setup();

      versionUpdates.next(versionReady);
      toastClosed.next({ dismissedByAction: true });
      versionUpdates.next(versionReady);

      expect(toastService.show).toHaveBeenCalledTimes(2);
    });
  });

  describe("Closing the toast", () => {
    it("Should activate the update and reload when the user accepts", async () => {
      setup();
      const reloadSpy = vi
        .spyOn(spectator.service, "reloadPage")
        .mockImplementation(() => undefined);
      versionUpdates.next(versionReady);

      toastClosed.next({ dismissedByAction: false });
      await vi.waitFor(() => expect(reloadSpy).toHaveBeenCalledOnce());

      expect(swSpy.activateUpdate).toHaveBeenCalledOnce();
    });

    it("Should not update when the user closes the toast", async () => {
      setup();
      const reloadSpy = vi
        .spyOn(spectator.service, "reloadPage")
        .mockImplementation(() => undefined);
      versionUpdates.next(versionReady);

      toastClosed.next({ dismissedByAction: true });
      await Promise.resolve();

      expect(swSpy.activateUpdate).not.toHaveBeenCalled();
      expect(reloadSpy).not.toHaveBeenCalled();
    });
  });
});

describe("Update Component", () => {
  const toastRef = { close: vi.fn() };
  const createComponent = createComponentFactory({
    component: UpdateComponent,
    providers: [{ provide: HotToastRef, useValue: toastRef }],
  });

  beforeEach(() => {
    toastRef.close.mockClear();
  });

  it("Should ask for the update when clicking the update link", () => {
    const spectator = createComponent();

    spectator.click(spectator.queryAll("a")[0]);

    expect(toastRef.close).toHaveBeenCalledWith({ dismissedByAction: false });
  });

  it("Should ask for the update when pressing enter on the update link", () => {
    const spectator = createComponent();

    spectator
      .queryAll("a")[0]
      .dispatchEvent(new KeyboardEvent("keyup", { key: "Enter" }));

    expect(toastRef.close).toHaveBeenCalledWith({ dismissedByAction: false });
  });

  it("Should only close the toast when clicking close", () => {
    const spectator = createComponent();

    spectator.click(spectator.queryAll("a")[1]);

    expect(toastRef.close).toHaveBeenCalledWith({ dismissedByAction: true });
  });

  it("Should only close the toast when pressing enter on close", () => {
    const spectator = createComponent();

    spectator
      .queryAll("a")[1]
      .dispatchEvent(new KeyboardEvent("keyup", { key: "Enter" }));

    expect(toastRef.close).toHaveBeenCalledWith({ dismissedByAction: true });
  });
});

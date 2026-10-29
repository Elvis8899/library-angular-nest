import { ApplicationRef } from "@angular/core";
import { SwUpdate, VersionEvent } from "@angular/service-worker";
import { Logger, LogLevel } from "@app/services/logger.service";
import { NotificationService } from "@app/services/notification.service";
import { AppUpdateService } from "@app/services/update.service";
import { ptBR } from "@app/shared/i18n/translations/pt-BR";
import { provideTranslateService, TranslateService } from "@ngx-translate/core";
import {
  createServiceFactory,
  createSpyObject,
  SpectatorService,
  SpyObject,
} from "@openng/spectator/vitest";
import { Subject } from "rxjs";

Logger.level = LogLevel.Off;

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
  let reloadPicked: Subject<void>;

  const createService = createServiceFactory({
    service: AppUpdateService,
    providers: [
      provideTranslateService(),
      { provide: SwUpdate, useFactory: () => swSpy },
    ],
    mocks: [NotificationService],
  });

  const setup = (isEnabled = true) => {
    versionUpdates = new Subject<VersionEvent>();
    swSpy = createSpyObject(SwUpdate, { isEnabled, versionUpdates });
    swSpy.checkForUpdate.mockResolvedValue(false);
    swSpy.activateUpdate.mockResolvedValue(true);
    spectator = createService();

    reloadPicked = new Subject();
    const notifications = spectator.inject(NotificationService);
    notifications.persistent.mockReturnValue(reloadPicked);
    return notifications;
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
    it("Should not show the update alert while a new version is downloading", () => {
      const notifications = setup();

      versionUpdates.next(versionDetected);

      expect(notifications.persistent).not.toHaveBeenCalled();
    });

    it("Should not show the update alert when the installation failed", () => {
      const notifications = setup();

      versionUpdates.next(installationFailed);

      expect(notifications.persistent).not.toHaveBeenCalled();
    });

    it("Should show the update alert when a new version is ready", () => {
      const notifications = setup();

      versionUpdates.next(versionReady);

      expect(notifications.persistent).toHaveBeenCalledExactlyOnceWith(
        "update.available",
        "update.reload",
      );
    });

    it("Should offer the update only once", () => {
      const notifications = setup();

      versionUpdates.next(versionReady);
      versionUpdates.next(versionReady);

      expect(notifications.persistent).toHaveBeenCalledOnce();
    });
  });

  describe("Dismissing the update alert", () => {
    it("Should activate the update and reload when the user picks Reload", async () => {
      setup();
      const reloadSpy = vi
        .spyOn(spectator.service, "reloadPage")
        .mockImplementation(() => undefined);
      versionUpdates.next(versionReady);

      reloadPicked.next();
      await vi.waitFor(() => expect(reloadSpy).toHaveBeenCalledOnce());

      expect(swSpy.activateUpdate).toHaveBeenCalledOnce();
    });
  });
});

describe("Update alert", () => {
  const versionUpdates = new Subject<VersionEvent>();
  const swSpy = createSpyObject(SwUpdate, { isEnabled: false, versionUpdates });
  const createService = createServiceFactory({
    service: AppUpdateService,
    providers: [
      provideTranslateService(),
      { provide: SwUpdate, useValue: swSpy },
    ],
  });

  it("Should offer the update in the current language, and reload on its action", async () => {
    // Arrange
    swSpy.activateUpdate.mockResolvedValue(true);
    const spectator = createService();
    const translate = spectator.inject(TranslateService);
    translate.setTranslation("pt-BR", ptBR);
    translate.use("pt-BR");
    const reloadSpy = vi
      .spyOn(spectator.service, "reloadPage")
      .mockImplementation(() => undefined);
    // Act
    versionUpdates.next(versionReady);
    spectator.inject(ApplicationRef).tick();
    // Assert: the real snackbar, in the overlay
    // The newest one: other specs' snackbars may still be animating out
    const all = document.querySelectorAll("mat-snack-bar-container");
    const snackBar = all.item(all.length - 1);
    expect(snackBar?.textContent).toContain("Uma nova versão está disponível.");
    expect(snackBar?.querySelector("button")?.textContent).toContain(
      "Atualizar",
    );
    // Act
    snackBar.querySelector("button")!.click();
    // Assert
    await vi.waitFor(() => expect(reloadSpy).toHaveBeenCalledOnce());
    expect(swSpy.activateUpdate).toHaveBeenCalledOnce();
  });
});

import { ApplicationRef } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { SwUpdate, VersionEvent } from "@angular/service-worker";
import { Logger } from "@app/services/logger.service";
import { AppUpdateService } from "@app/services/update.service";
import { ptBR } from "@app/shared/i18n/translations/pt-BR";
import {
  createServiceFactory,
  createSpyObject,
  SpectatorService,
  SpyObject,
} from "@ngneat/spectator/vitest";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
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
  let snackBarDismissed: Subject<{ dismissedByAction: boolean }>;

  const createService = createServiceFactory({
    service: AppUpdateService,
    imports: [TranslateModule.forRoot()],
    providers: [{ provide: SwUpdate, useFactory: () => swSpy }],
    mocks: [MatSnackBar],
  });

  const setup = (isEnabled = true) => {
    versionUpdates = new Subject<VersionEvent>();
    swSpy = createSpyObject(SwUpdate, { isEnabled, versionUpdates });
    swSpy.checkForUpdate.mockResolvedValue(false);
    swSpy.activateUpdate.mockResolvedValue(true);
    spectator = createService();

    snackBarDismissed = new Subject();
    const snackBar = spectator.inject(MatSnackBar);
    snackBar.open.mockReturnValue({
      afterDismissed: () => snackBarDismissed,
    } as unknown as ReturnType<MatSnackBar["open"]>);
    return snackBar;
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
      const snackBar = setup();

      versionUpdates.next(versionDetected);

      expect(snackBar.open).not.toHaveBeenCalled();
    });

    it("Should not show the update alert when the installation failed", () => {
      const snackBar = setup();

      versionUpdates.next(installationFailed);

      expect(snackBar.open).not.toHaveBeenCalled();
    });

    it("Should show the update alert when a new version is ready", () => {
      const snackBar = setup();

      versionUpdates.next(versionReady);

      // The keys: no translations are loaded here
      expect(snackBar.open).toHaveBeenCalledExactlyOnceWith(
        "update.available",
        "update.reload"
      );
    });

    it("Should show the update alert only once while it is open", () => {
      const snackBar = setup();

      versionUpdates.next(versionReady);
      versionUpdates.next(versionReady);

      expect(snackBar.open).toHaveBeenCalledOnce();
    });

    it("Should show the update alert again after it was closed", () => {
      const snackBar = setup();

      versionUpdates.next(versionReady);
      snackBarDismissed.next({ dismissedByAction: false });
      versionUpdates.next(versionReady);

      expect(snackBar.open).toHaveBeenCalledTimes(2);
    });
  });

  describe("Dismissing the update alert", () => {
    it("Should activate the update and reload when the user picks Reload", async () => {
      setup();
      const reloadSpy = vi
        .spyOn(spectator.service, "reloadPage")
        .mockImplementation(() => undefined);
      versionUpdates.next(versionReady);

      snackBarDismissed.next({ dismissedByAction: true });
      await vi.waitFor(() => expect(reloadSpy).toHaveBeenCalledOnce());

      expect(swSpy.activateUpdate).toHaveBeenCalledOnce();
    });

    it("Should not update when the alert goes away without the action", async () => {
      setup();
      const reloadSpy = vi
        .spyOn(spectator.service, "reloadPage")
        .mockImplementation(() => undefined);
      versionUpdates.next(versionReady);

      // Dismissed some other way than its action
      snackBarDismissed.next({ dismissedByAction: false });
      await Promise.resolve();

      expect(swSpy.activateUpdate).not.toHaveBeenCalled();
      expect(reloadSpy).not.toHaveBeenCalled();
    });
  });
});

describe("Update alert", () => {
  const versionUpdates = new Subject<VersionEvent>();
  const swSpy = createSpyObject(SwUpdate, { isEnabled: false, versionUpdates });
  const createService = createServiceFactory({
    service: AppUpdateService,
    imports: [TranslateModule.forRoot()],
    providers: [{ provide: SwUpdate, useValue: swSpy }],
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
    const snackBar = document.querySelector("mat-snack-bar-container");
    expect(snackBar?.textContent).toContain("Uma nova versão está disponível.");
    expect(snackBar?.querySelector("button")?.textContent).toContain(
      "Atualizar"
    );
    // Act
    (snackBar?.querySelector("button") as HTMLButtonElement).click();
    // Assert
    await vi.waitFor(() => expect(reloadSpy).toHaveBeenCalledOnce());
    expect(swSpy.activateUpdate).toHaveBeenCalledOnce();
  });
});

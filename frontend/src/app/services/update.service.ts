import { ApplicationRef, inject, Injectable } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { SwUpdate, VersionEvent } from "@angular/service-worker";
import { Logger } from "@app/services/logger.service";
import { NotificationService } from "@app/services/notification.service";
import { concat, interval } from "rxjs";
import { first } from "rxjs/operators";

const log = new Logger("AppUpdateService");

/* The `AppUpdateService` is responsible for checking for app updates using a
service worker and displaying update alerts to the user. */
@Injectable({
  providedIn: "root",
})
export class AppUpdateService {
  private _isUpdateOffered = false;

  appRef = inject(ApplicationRef);
  private readonly _swUpdate = inject(SwUpdate);
  private readonly _notifications = inject(NotificationService);

  constructor() {
    log.info("Update service is running...");
    if (this._swUpdate?.isEnabled) {
      log.info("Service worker enabled");

      // Allow the app to stabilize first, before starting polling for updates.
      const appIsStable$ = this.appRef.isStable.pipe(
        first((isStable) => isStable === true)
      );
      const hours = 6;
      const everyNHours$ = interval(1000 * 60 * 60 * hours);
      const everyNHoursOnceAppIsStable$ = concat(
        appIsStable$,
        everyNHours$
      ).pipe(takeUntilDestroyed());

      everyNHoursOnceAppIsStable$.subscribe(this.updateCheck.bind(this));
    } else {
      log.info("No service worker allow");
    }

    this._swUpdate?.versionUpdates
      ?.pipe(takeUntilDestroyed())
      .subscribe(this.onVersionEvent.bind(this));
  }

  async updateCheck() {
    try {
      log.info("Checking for app updates...");
      this._isUpdateOffered = false;
      const updateFound = await this._swUpdate.checkForUpdate();
      log.info(
        updateFound
          ? "A new version is available."
          : "Already on the latest version."
      );
    } catch (err) {
      log.error("Failed to check for updates:", err);
    }
  }

  onVersionEvent(evt: VersionEvent) {
    switch (evt.type) {
      case "VERSION_DETECTED":
        log.info(`Downloading new app version: ${evt.version.hash}`);
        break;
      case "VERSION_READY":
        log.info(`Current app version: ${evt.currentVersion.hash}`);
        log.info(`New app version ready for use: ${evt.latestVersion.hash}`);
        this._showAppUpdateAlert();
        break;
      case "VERSION_INSTALLATION_FAILED":
        log.info(
          `Failed to install app version '${evt.version.hash}': ${evt.error}`
        );
        break;
    }
  }

  // Stays until the user reloads, so an update is never applied in the
  // middle of their work, and returns after any other message
  private _showAppUpdateAlert() {
    if (this._isUpdateOffered) {
      return;
    }
    this._isUpdateOffered = true;
    this._notifications
      .persistent("update.available", "update.reload")
      .subscribe(() =>
        this._swUpdate.activateUpdate().then(() => this.reloadPage())
      );
  }

  // Separate so tests can stub it: the test DOM can't reload or spy on location
  /* v8 ignore next 3 */
  reloadPage(): void {
    document.location.reload();
  }
}

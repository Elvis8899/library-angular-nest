import { ApplicationRef, Component, inject, Injectable } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { SwUpdate, VersionEvent } from "@angular/service-worker";
import { Logger } from "@app/services/logger.service";
import { HotToastRef, HotToastService } from "@ngxpert/hot-toast";
import { concat, interval } from "rxjs";
import { first } from "rxjs/operators";

const log = new Logger("AppUpdateService");

/* The `AppUpdateService` is responsible for checking for app updates using a
service worker and displaying update alerts to the user. */
@Injectable({
  providedIn: "root",
})
export class AppUpdateService {
  private _isUpdateToastShown = false;

  appRef = inject(ApplicationRef);
  private readonly _swUpdate = inject(SwUpdate);
  private readonly _toastService = inject(HotToastService);

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
      this._isUpdateToastShown = false;
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

  private _showAppUpdateAlert() {
    if (this._isUpdateToastShown) {
      return;
    }
    this._isUpdateToastShown = true;
    const toastRef = this._toastService.show(UpdateComponent, {
      autoClose: false,
      dismissible: false,
    });
    toastRef.afterClosed.subscribe(({ dismissedByAction }) => {
      this._isUpdateToastShown = false;
      if (dismissedByAction) return;
      this._swUpdate.activateUpdate().then(() => this.reloadPage());
    });
  }

  // Separate so tests can stub it: jsdom can't reload or spy on location
  /* v8 ignore next 3 */
  reloadPage(): void {
    document.location.reload();
  }
}

// App Update Notification Component
@Component({
  selector: "app-update-component",
  template: `
    New Version is Available.
    <a
      style="color: #E9380BFF"
      (click)="toastRef.close({ dismissedByAction: false })"
      (keyup.enter)="toastRef.close({ dismissedByAction: false })"
      tabindex="0"
      >Please Click to Update</a
    >
    or
    <a
      style="color: #E9380BFF"
      (click)="toastRef.close({ dismissedByAction: true })"
      (keyup.enter)="toastRef.close({ dismissedByAction: true })"
      tabindex="1"
      >Close</a
    >
  `,
})
export class UpdateComponent {
  public toastRef = inject(HotToastRef);
}

import { SwUpdate, VersionEvent } from "@angular/service-worker";
import { Logger } from "@app/services/logger.service";
import {
  AppUpdateService,
  UpdateComponent,
} from "@app/services/update.service";
import {
  createServiceFactory,
  createSpyObject,
  SpectatorService,
} from "@ngneat/spectator/vitest";
import { HotToastService } from "@ngxpert/hot-toast";
import { BehaviorSubject } from "rxjs";

Logger.level = 0;

describe("Update Service", () => {
  let spectator: SpectatorService<AppUpdateService>;

  const versionDetectedEvent: VersionEvent = {
    type: "VERSION_DETECTED",
    version: { hash: "1.0.1" },
  };

  // const versionReadyEvent: VersionEvent = {
  //   type: "VERSION_READY",
  //   currentVersion: {
  //     hash: "1.0.0",
  //   },
  //   latestVersion: {
  //     hash: "1.0.1",
  //   },
  // };
  const swSpy = createSpyObject(SwUpdate, {
    isEnabled: true,
    versionUpdates: new BehaviorSubject(versionDetectedEvent),
  });
  const createService = createServiceFactory({
    service: AppUpdateService,
    imports: [UpdateComponent],
    providers: [{ provide: SwUpdate, useValue: swSpy }],
    mocks: [HotToastService],
  });

  beforeEach(() => {
    (swSpy as { isEnabled: boolean }).isEnabled = true;
    swSpy.checkForUpdate.mockClear();
  });

  it("On init, should check for updates", () => {
    spectator = createService();
    // When saving the credentials

    expect(swSpy.checkForUpdate).toBeCalledTimes(1);
  });
  it("If disabled, should not check for updates", () => {
    (swSpy as { isEnabled: boolean }).isEnabled = false;
    spectator = createService();
    // When saving the credentials

    expect(swSpy.checkForUpdate).toBeCalledTimes(0);
  });

  it("Should not show toast on version detected event", () => {
    const toastService = spectator.inject(HotToastService);
    spectator = createService();
    (swSpy.versionUpdates as BehaviorSubject<VersionEvent>).next(
      versionDetectedEvent
    );
    expect(toastService.info).toBeCalledTimes(0);
  });

  // it("Should show toast on version ready event", () => {
  //   const toastService = spectator.inject(HotToastService);
  //   spectator = createService();
  //   (swSpy.versionUpdates as BehaviorSubject<VersionEvent>).next(
  //     versionReadyEvent
  //   );
  //   expect(toastService.info).toBeCalledTimes(0);
  // });
});

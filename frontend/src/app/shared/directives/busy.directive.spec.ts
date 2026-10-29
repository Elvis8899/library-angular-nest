import { signal } from "@angular/core";
import { MatButton } from "@angular/material/button";
import { BusyDirective } from "@app/shared/directives/busy.directive";
import {
  createDirectiveFactory,
  SpectatorDirective,
} from "@openng/spectator/vitest";

describe("BusyDirective", () => {
  let spectator: SpectatorDirective<BusyDirective>;
  const busy = signal(false);
  const createDirective = createDirectiveFactory({
    directive: BusyDirective,
    imports: [MatButton],
  });

  beforeEach(() => {
    busy.set(false);
    spectator = createDirective(
      `<button matButton [appBusy]="busy()">Salvar</button>`,
      { hostProps: { busy } },
    );
  });

  it("Should put the spinner over the kept label while busy", () => {
    // Assert
    expect(spectator.element).not.toHaveClass("app-busy");
    expect(spectator.element).not.toHaveAttribute("aria-busy");
    expect(spectator.query("mat-progress-spinner")).not.toExist();
    // Act
    busy.set(true);
    spectator.detectChanges();
    // Assert
    expect(spectator.element).toHaveClass("app-busy");
    expect(spectator.element).toHaveAttribute("aria-busy", "true");
    expect(spectator.query("button mat-progress-spinner")).toExist();
    expect(spectator.element).toHaveText("Salvar");
    // Act
    busy.set(false);
    spectator.detectChanges();
    // Assert
    expect(spectator.element).not.toHaveClass("app-busy");
    expect(spectator.query("mat-progress-spinner")).not.toExist();
  });
});

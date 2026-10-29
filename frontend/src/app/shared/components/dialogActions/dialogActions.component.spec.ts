import { signal } from "@angular/core";
import { MatDialogRef } from "@angular/material/dialog";
import { DialogActionsComponent } from "@app/shared/components/dialogActions/dialogActions.component";
import { provideTranslateService } from "@ngx-translate/core";
import { createHostFactory, SpectatorHost } from "@openng/spectator/vitest";

describe("DialogActionsComponent", () => {
  let spectator: SpectatorHost<DialogActionsComponent>;
  const close = vi.fn();
  const createHost = createHostFactory({
    component: DialogActionsComponent,
    providers: [
      provideTranslateService(),
      { provide: MatDialogRef, useValue: { close } },
    ],
  });
  const primary = () =>
    spectator.query<HTMLButtonElement>("button[name='save']");

  beforeEach(() => close.mockClear());

  it("Should cancel, and accept with the primary button", () => {
    // Arrange
    const accept = vi.fn();
    spectator = createHost(
      `<app-dialog-actions (accept)="accept()"><button name="more">+</button></app-dialog-actions>`,
      { hostProps: { accept } },
    );
    // Assert: projected buttons go between the two
    expect(
      spectator.queryAll("button").map((button) => button.getAttribute("name")),
    ).toEqual(["cancel", "more", "save"]);
    expect(primary()).toHaveText("common.save");
    expect(primary()).toHaveAttribute("type", "button");
    expect(primary()).not.toHaveClass("destructive");
    // Act
    spectator.click(primary()!);
    spectator.click("button[name='cancel']");
    // Assert
    expect(accept).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledWith(false);
  });

  it("Should submit its form instead, and close with the result given", () => {
    // Arrange
    const accept = vi.fn();
    const submitted = vi.fn((event: Event) => event.preventDefault());
    spectator = createHost(
      `<form id="f" (submit)="submitted($event)"></form>
       <app-dialog-actions (accept)="accept()" [cancelResult]="null" [destructive]="true" form="f" label="common.confirm" name="confirm" />`,
      { hostProps: { accept, submitted } },
    );
    const button = spectator.query<HTMLButtonElement>(
      "button[name='confirm']",
    )!;
    // Act
    button.click();
    spectator.click("button[name='cancel']");
    // Assert
    expect(button).toHaveText("common.confirm");
    expect(button).toHaveAttribute("type", "submit");
    expect(button).toHaveClass("destructive");
    expect(submitted).toHaveBeenCalledTimes(1);
    expect(accept).not.toHaveBeenCalled();
    expect(close).toHaveBeenCalledWith(null);
  });

  it("Should hold the button while busy, and when disabled", () => {
    // Arrange
    const busy = signal(true);
    const disabled = signal(false);
    spectator = createHost(
      `<app-dialog-actions [busy]="busy()" [disabled]="disabled()" />`,
      { hostProps: { busy, disabled } },
    );
    // Assert
    expect(primary()).toBeDisabled();
    expect(primary()!.querySelector("mat-progress-spinner")).toExist();
    // Act
    busy.set(false);
    disabled.set(true);
    spectator.detectChanges();
    // Assert
    expect(primary()).toBeDisabled();
    expect(primary()).toHaveText("common.save");
    // Act
    disabled.set(false);
    spectator.detectChanges();
    // Assert
    expect(primary()).not.toBeDisabled();
  });
});

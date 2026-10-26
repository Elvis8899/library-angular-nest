import { ActivatedRouteSnapshot, RouterStateSnapshot } from "@angular/router";
import { CredentialsService } from "@app/services/credentials.service";
import { ConfirmDialog } from "@app/shared/components/confirmDialog/confirm.dialog.component";
import {
  HasUnsavedChanges,
  unsavedChangesGuard,
} from "@app/shared/guards/unsavedChanges.guard";
import {
  createInjectionContextFactory,
  SpectatorInjectionContext,
} from "@openng/spectator/vitest";
import { Observable, of } from "rxjs";

describe("unsavedChangesGuard", () => {
  let spectator: SpectatorInjectionContext;
  const confirm = vi.fn(() => of(false));
  let authenticated = true;
  const createInjectionContext = createInjectionContextFactory({
    providers: [
      { provide: ConfirmDialog, useValue: { confirm } },
      {
        provide: CredentialsService,
        useValue: { isAuthenticated: () => authenticated },
      },
    ],
  });

  const leave = (dirty: boolean | null) =>
    spectator.runInInjectionContext(() =>
      unsavedChangesGuard(
        dirty === null
          ? null
          : ({ hasUnsavedChanges: () => dirty } satisfies HasUnsavedChanges),
        {} as ActivatedRouteSnapshot,
        {} as RouterStateSnapshot,
        {} as RouterStateSnapshot
      )
    );

  beforeEach(() => {
    confirm.mockClear();
    authenticated = true;
    spectator = createInjectionContext();
  });

  it("Should let a screen without unsaved changes go", () => {
    // Act
    const result = leave(false);
    // Assert
    expect(result).toBe(true);
    expect(confirm).not.toHaveBeenCalled();
  });

  it("Should let a route that was never rendered go", () => {
    expect(leave(null)).toBe(true);
  });

  it("Should let go without asking once the session ended", () => {
    // Arrange: the interceptor cleared the credentials on a 401
    authenticated = false;
    // Act
    const result = leave(true);
    // Assert
    expect(result).toBe(true);
    expect(confirm).not.toHaveBeenCalled();
  });

  it("Should ask before dropping unsaved changes", () => {
    // Arrange
    const answers: boolean[] = [];
    // Act
    (leave(true) as Observable<boolean>).subscribe((answer) =>
      answers.push(answer)
    );
    // Assert
    expect(confirm).toHaveBeenCalledWith(
      expect.objectContaining({ message: "unsavedChanges.message" })
    );
    expect(answers).toEqual([false]);
  });
});

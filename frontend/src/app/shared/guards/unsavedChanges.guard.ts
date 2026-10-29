import { inject } from "@angular/core";
import { CanDeactivateFn } from "@angular/router";
import { CredentialsService } from "@app/services/credentials.service";
import { ConfirmDialog } from "@app/shared/components/confirmDialog/confirm.dialog.component";

/** A screen whose route asks before leaving its unsaved changes. */
export interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean;
}

/**
 * Asks before leaving a screen with unsaved changes (a form's):
 * `canDeactivate: [unsavedChangesGuard]` on its route. A session that ended
 * (the error interceptor's way to the login) leaves without asking: staying
 * would keep a form nothing can save.
 */
export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges | null> = (
  component,
) =>
  // No component when the route was never rendered
  !component?.hasUnsavedChanges() ||
  !inject(CredentialsService).isAuthenticated() ||
  inject(ConfirmDialog).confirm({
    title: "unsavedChanges.title",
    message: "unsavedChanges.message",
    confirmLabel: "unsavedChanges.confirm",
    destructive: true,
  });

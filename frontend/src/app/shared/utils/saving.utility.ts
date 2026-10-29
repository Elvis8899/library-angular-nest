import { inject, Signal, signal } from "@angular/core";
import { Logger } from "@app/services/logger.service";
import { NotificationService } from "@app/services/notification.service";
import { ApiError } from "@app/shared/utils/apiError.utility";
import { reportError } from "@app/shared/utils/loading.utility";
import { Observable } from "rxjs";

/** True while a save's request is out; the button holds meanwhile. */
export type Saving = Signal<boolean> & {
  /**
   * Sends the request, unless one is still out. `done` gets the answer; a
   * failure is logged and its message shown, unless `refused` handles it
   * (returning true).
   */
  run<T>(
    request: Observable<T>,
    done: (value: T) => void,
    refused?: (error: ApiError) => boolean,
  ): void;
};

/** A save's requests: one at a time, and the API's message when one fails. */
export const injectSaving = (log: Logger): Saving => {
  const failed = reportError(log, inject(NotificationService));
  const saving = signal(false);
  return Object.assign(saving.asReadonly(), {
    run: <T>(
      request: Observable<T>,
      done: (value: T) => void,
      refused?: (error: ApiError) => boolean,
    ) => {
      if (saving()) return;
      saving.set(true);
      // Done before the handlers, which may send again (once confirmed)
      request.subscribe({
        next: (value) => {
          saving.set(false);
          done(value);
        },
        error: (error: ApiError | null) => {
          saving.set(false);
          if (error && refused?.(error)) return;
          failed(error);
        },
        complete: () => saving.set(false),
      });
    },
  });
};

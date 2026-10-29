import { Signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { Logger } from "@app/services/logger.service";
import { NotificationService } from "@app/services/notification.service";
import { ApiError } from "@app/shared/utils/apiError.utility";
import {
  catchError,
  merge,
  Observable,
  of,
  OperatorFunction,
  pipe,
  startWith,
  switchMap,
} from "rxjs";

/** Logs a failed request and shows the API's message (blank without one). */
export const reportError =
  (log: Logger, notify: NotificationService) =>
  (error: ApiError | null): void => {
    log.error(error);
    notify.errorMessage(error?.message ?? "");
  };

/** A screen's load that fails as null, logged (and its message shown, given
 * the notifications). */
export const orNull = <T>(
  log: Logger,
  notify?: NotificationService,
): OperatorFunction<T, T | null> =>
  catchError<T, Observable<null>>((error: ApiError | null) => {
    if (notify) reportError(log, notify)(error);
    else log.error(error);
    return of(null);
  });

/** A screen's load as `*appLoaded` reads it: undefined while it loads, then
 * the value, or null when it fails. */
export const loading = <T>(
  log: Logger,
  notify?: NotificationService,
): OperatorFunction<T, T | null | undefined> =>
  pipe(startWith(undefined), orNull<T | undefined>(log, notify));

/** A screen's load, made again whenever a trigger fires (a live change, a
 * reload): undefined while the first one loads, then the value, or null when
 * it fails. Built in an injection context, as `toSignal` is. */
export const reloaded = <T>(
  triggers: readonly Observable<unknown>[],
  request: () => Observable<T>,
  log: Logger,
  notify?: NotificationService,
): Signal<T | null | undefined> =>
  toSignal(
    merge(...triggers).pipe(
      startWith(null),
      switchMap(() => request().pipe(orNull(log, notify))),
    ),
  );

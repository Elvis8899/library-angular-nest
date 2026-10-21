import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
  HttpStatusCode,
} from "@angular/common/http";
import { inject } from "@angular/core";
import { Router } from "@angular/router";
import { AuthenticationService } from "@app/services/authentication.service";
import { CredentialsService } from "@app/services/credentials.service";
import { Logger } from "@app/services/logger.service";
import { t } from "@app/shared/i18n/translations/translationKey";
import { TranslateService } from "@ngx-translate/core";
import { Observable, throwError } from "rxjs";
import { catchError, switchMap } from "rxjs/operators";

const log = new Logger("ErrorHandlerInterceptor");

// Requests that must not trigger a token refresh when they fail with 401
const isAuthRequest = (request: HttpRequest<unknown>): boolean =>
  /\/v1\/(login|refresh)$/.test(request.url);

export const errorHandlerInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const _credentialsService = inject(CredentialsService);
  const _authenticationService = inject(AuthenticationService);
  const _router = inject(Router);
  const _translate = inject(TranslateService);

  const handleError = (errorResponse: HttpErrorResponse) => {
    const status = errorResponse.status;
    if (
      status === HttpStatusCode.Unauthorized ||
      status === HttpStatusCode.Forbidden
    ) {
      _credentialsService.setCredentials();
      _router.navigate(["/login"]);
    }
    let error = errorResponse.error;
    if (!error || !("message" in error)) {
      error = new Error(_translate.instant(t("errors.unknown")));
    } else if (typeof error.code === "string") {
      // The API's errors carry a code (user.cpfTaken); show its translation,
      // or the API's message when there's none
      const key = `errors.${error.code}`;
      const translated = _translate.instant(key);
      if (translated !== key) error = { ...error, message: translated };
    }
    log.error("Request error", error, request.urlWithParams, request.method);
    return throwError(() => error);
  };

  return next(request).pipe(
    catchError((errorResponse: HttpErrorResponse) => {
      const canRefresh =
        errorResponse.status === HttpStatusCode.Unauthorized &&
        !isAuthRequest(request) &&
        !!_credentialsService.credentials?.refreshToken;
      if (!canRefresh) {
        return handleError(errorResponse);
      }
      // Access token expired: get new tokens and retry the request once
      return _authenticationService.refresh().pipe(
        catchError(() => handleError(errorResponse)),
        switchMap((credentials) =>
          next(
            request.clone({
              setHeaders: {
                Authorization: `Bearer ${credentials.accessToken}`,
              },
            })
          ).pipe(catchError(handleError))
        )
      );
    })
  );
};

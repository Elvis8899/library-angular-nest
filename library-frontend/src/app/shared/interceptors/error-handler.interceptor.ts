import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from "@angular/common/http";
import { inject } from "@angular/core";
import { Router } from "@angular/router";
import { AuthenticationService } from "@app/services/authentication.service";
import { CredentialsService } from "@app/services/credentials.service";
import { Logger } from "@app/services/logger.service";
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

  const handleError = (errorResponse: HttpErrorResponse) => {
    const status = errorResponse.status;
    if (status === 401 || status === 403) {
      _credentialsService.setCredentials();
      _router.navigate(["/login"]);
    }
    let error = errorResponse.error;
    if (!error || !("message" in error)) {
      error = new Error("Something bad happened; please try again later.");
    }
    log.error("Request error", error, request.urlWithParams, request.method);
    return throwError(() => error);
  };

  return next(request).pipe(
    catchError((errorResponse: HttpErrorResponse) => {
      const canRefresh =
        errorResponse.status === 401 &&
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

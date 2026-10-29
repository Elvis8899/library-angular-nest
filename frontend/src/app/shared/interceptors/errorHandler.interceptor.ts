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

// HttpErrorResponse types its status as a plain number
const unauthorized: number = HttpStatusCode.Unauthorized;
const forbidden: number = HttpStatusCode.Forbidden;

// The code of an API error's body (user.cpfTaken), if it has one
const codeOf = (body: unknown): string | undefined =>
  typeof body === "object" &&
  body !== null &&
  "code" in body &&
  typeof body.code === "string"
    ? body.code
    : undefined;

// A 401, or a guard's 403 (the role can't open the route). A 403 with a code
// is a domain refusal: shown like other API errors
const endsSession = (response: HttpErrorResponse): boolean =>
  response.status === unauthorized ||
  (response.status === forbidden && codeOf(response.error) === undefined);

export const errorHandlerInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  const _credentialsService = inject(CredentialsService);
  const _authenticationService = inject(AuthenticationService);
  const _router = inject(Router);
  const _translate = inject(TranslateService);

  const handleError = (errorResponse: HttpErrorResponse) => {
    if (endsSession(errorResponse)) {
      _credentialsService.setCredentials();
      void _router.navigate(["/login"]);
    }
    const body: unknown = errorResponse.error;
    const code = codeOf(body);
    let error = body;
    // Not the API's JSON: a proxy's HTML page (nginx's 502 while the API
    // restarts), plain text or nothing
    if (typeof body !== "object" || !body || !("message" in body)) {
      error = new Error(_translate.instant(t("errors.unknown")));
    } else if (code !== undefined) {
      // The API's errors carry a code (user.cpfTaken); show its translation,
      // or the API's message when there's none
      const key = `errors.${code}`;
      const translated = _translate.instant(key);
      if (translated !== key) error = { ...body, message: translated };
    }
    log.error("Request error", error, request.urlWithParams, request.method);
    return throwError(() => error);
  };

  return next(request).pipe(
    catchError((errorResponse: HttpErrorResponse) => {
      const canRefresh =
        errorResponse.status === unauthorized &&
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
            }),
          ).pipe(catchError(handleError)),
        ),
      );
    }),
  );
};

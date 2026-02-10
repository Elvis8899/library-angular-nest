import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from "@angular/common/http";
import { inject } from "@angular/core";
import { Router } from "@angular/router";
import { CredentialsService } from "@app/services/credentials.service";
import { Logger } from "@app/services/logger.service";
import { Observable, throwError } from "rxjs";
import { catchError } from "rxjs/operators";

const log = new Logger("ErrorHandlerInterceptor");

export const errorHandlerInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const _credentialsService = inject(CredentialsService);
  const _router = inject(Router);
  return next(request).pipe(
    catchError((errorResponse: HttpErrorResponse) => {
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
    })
  );
};

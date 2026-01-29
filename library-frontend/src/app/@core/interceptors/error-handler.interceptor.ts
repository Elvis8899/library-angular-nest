import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, throwError } from "rxjs";
import { catchError } from "rxjs/operators";

import { environment } from "@env/environment";
import { Logger } from "../services";

const log = new Logger("ErrorHandlerInterceptor");

/**
 * Adds a default error handler to all requests.
 */
@Injectable({
  providedIn: "root",
})
export class ErrorHandlerInterceptor implements HttpInterceptor {
  intercept<T>(
    request: HttpRequest<T>,
    next: HttpHandler
  ): Observable<HttpEvent<T>> {
    return next
      .handle(request)
      .pipe(catchError((error) => this._errorHandler<T>(error)));
  }

  //TODO: Customize the default error handler here if needed
  private _errorHandler<T>(response: HttpEvent<T>): Observable<HttpEvent<T>> {
    if (!environment.production) {
      // Do something with the error
      log.error("Request error", response);
    }

    if ("error" in response && "message" in (response.error as Error)) {
      throw response.error;
    }
    return throwError(
      () => new Error("Something bad happened; please try again later.")
    );
  }
}

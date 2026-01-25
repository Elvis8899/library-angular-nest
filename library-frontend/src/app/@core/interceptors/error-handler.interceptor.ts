import { Injectable } from "@angular/core";
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from "@angular/common/http";
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
  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return next
      .handle(request)
      .pipe(catchError((error) => this._errorHandler(error)));
  }

  //TODO: Customize the default error handler here if needed
  private _errorHandler(response: HttpEvent<any>): Observable<HttpEvent<any>> {
    console.log("HTTP Error", response);
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

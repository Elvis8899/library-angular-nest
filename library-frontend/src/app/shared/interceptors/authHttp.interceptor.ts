import {
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from "@angular/common/http";
import { inject } from "@angular/core";
import { CredentialsService } from "@app/services/credentials.service";
import { TranslateService } from "@ngx-translate/core";
import { finalize, Observable, Subject, takeUntil } from "rxjs";

const ongoingRequests = new Map<string, Subject<HttpEvent<unknown>>>();
export const authHttpInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const _credentialsService = inject(CredentialsService);
  const _translateService = inject(TranslateService);

  if (request.headers.get("noauth")) {
    return next(request) as Observable<HttpEvent<unknown>>;
  }

  const { accessToken } = _credentialsService.credentials || {};

  const currentLang = _translateService.getCurrentLang().substring(0, 2);

  const newHeaders: Record<string, string> = {
    "Accept-Language": currentLang,
    "Content-Language": currentLang,
    lang: currentLang,
  };
  if (accessToken) {
    // if (!(request.body instanceof FormData)) {
    //   newHeaders["content-type"] = "application/json";
    // }
    newHeaders["Authorization"] = `Bearer ${accessToken}`;
  }

  /**
   * In below piece of code If there is an ongoing request with the same method and URL than return the ongoing request instead of creating a new one
   * This is useful when the user clicks multiple times on a button that triggers a request
   */

  const requestKey = getRequestKey(request);

  const ongoingRequest = ongoingRequests.get(requestKey);
  if (ongoingRequest) {
    return ongoingRequest.asObservable();
  }

  const cancelSubject = new Subject<HttpEvent<unknown>>();
  ongoingRequests.set(requestKey, cancelSubject);

  const clonedRequest = request.clone({
    setHeaders: newHeaders,
  });

  return next(clonedRequest).pipe(
    takeUntil(cancelSubject),
    finalize(() => {
      ongoingRequests.delete(requestKey);
      cancelSubject.complete();
    })
  );
};

const getRequestKey = (req: HttpRequest<unknown>): string => {
  return `${req.method} ${req.urlWithParams}`;
};

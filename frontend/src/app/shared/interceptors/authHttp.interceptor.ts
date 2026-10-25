import {
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from "@angular/common/http";
import { inject } from "@angular/core";
import { CredentialsService } from "@app/services/credentials.service";
import { environment } from "@env/environment";
import { TranslateService } from "@ngx-translate/core";
import { finalize, Observable, share } from "rxjs";

const ongoingRequests = new Map<string, Observable<HttpEvent<unknown>>>();
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

  const currentLang = (
    _translateService.getCurrentLang() ?? environment.defaultLanguage
  ).substring(0, 2);

  const newHeaders: Record<string, string> = {
    "Accept-Language": currentLang,
    "Content-Language": currentLang,
    lang: currentLang,
  };
  if (accessToken) {
    newHeaders["Authorization"] = `Bearer ${accessToken}`;
  }

  /**
   * A request with the same method and URL as one in flight shares that one
   * instead of going again: a double click sends one write, and two screens
   * reloading the same record at once both get its answer.
   */

  const requestKey = getRequestKey(request);

  const ongoingRequest = ongoingRequests.get(requestKey);
  if (ongoingRequest) {
    return ongoingRequest;
  }

  const clonedRequest = request.clone({
    setHeaders: newHeaders,
  });

  const shared = next(clonedRequest).pipe(
    finalize(() => ongoingRequests.delete(requestKey)),
    share()
  );
  ongoingRequests.set(requestKey, shared);
  return shared;
};

const getRequestKey = (req: HttpRequest<unknown>): string => {
  return `${req.method} ${req.urlWithParams}`;
};

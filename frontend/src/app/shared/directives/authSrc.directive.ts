import { HttpClient } from "@angular/common/http";
import { computed, Directive, inject, input } from "@angular/core";
import { toObservable, toSignal } from "@angular/core/rxjs-interop";
import { Logger } from "@app/services/logger.service";
import { objectUrlOf } from "@app/shared/utils/objectUrl.utility";
import { catchError, Observable, of, switchMap } from "rxjs";

const log = new Logger("AuthSrcDirective");

/**
 * An image the API serves behind the token, which an `<img src>` can't
 * send: loaded through HttpClient (the interceptors add the token) and
 * shown from an object URL, or `fallback` while there's none, without a
 * path, or when it fails.
 *
 *   <img [appAuthSrc]="coverPath(book)" fallback="images/no-image.png" alt="" />
 */
@Directive({
  selector: "img[appAuthSrc]",
  host: { "[src]": "src()" },
})
export class AuthSrcDirective {
  readonly appAuthSrc = input.required<string | null>();
  readonly fallback = input.required<string>();

  private readonly _http = inject(HttpClient);

  private readonly _blob = toSignal(
    toObservable(this.appAuthSrc).pipe(
      switchMap((path): Observable<Blob | null> =>
        path === null
          ? of(null)
          : this._http.get(path, { responseType: "blob" }).pipe(
              catchError((error: unknown) => {
                log.error(error);
                return of(null);
              })
            )
      )
    ),
    { initialValue: null }
  );
  private readonly _url = objectUrlOf(this._blob);

  readonly src = computed(() => this._url() ?? this.fallback());
}

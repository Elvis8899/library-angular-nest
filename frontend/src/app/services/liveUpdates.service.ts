import {
  computed,
  effect,
  inject,
  Injectable,
  InjectionToken,
} from "@angular/core";
import { AuthenticationService } from "@app/services/authentication.service";
import { CredentialsService } from "@app/services/credentials.service";
import {
  LIVE_UPDATES_PATH,
  type LiveUpdateEvents,
  Resource,
  RESOURCE_CHANGED,
  type ResourceChange,
} from "@library/contracts";
import { filter, map, merge, noop, Observable, Subject } from "rxjs";
import { io, Socket } from "socket.io-client";

/** What a screen shows and reloads (the contracts' `Resource`). */
export const RESOURCE = {
  USERS: Resource.Users,
  // Lending example
  BOOKS: Resource.Books,
  RENTALS: Resource.Rentals,
} as const;
export type RESOURCE = Resource;

/** A change the backend announces: the client reloads it through REST. */
export type { ResourceChange };

// The API's Socket.IO gateway, on the page's own host (nginx, or the dev
// server's proxy)
export const LIVE_UPDATES_SOCKET = new InjectionToken<Socket<LiveUpdateEvents>>(
  "LiveUpdatesSocket",
  {
    providedIn: "root",
    factory: () => io({ path: LIVE_UPDATES_PATH, autoConnect: false }),
  },
);

/**
 * Tells screens when what they show changed, so they reload it. Connected
 * while a user is logged in, and again as another user, who joins other
 * rooms. Changes announced while disconnected are lost, so after a
 * reconnection every screen reloads.
 */
@Injectable({
  providedIn: "root",
})
export class LiveUpdatesService {
  private readonly _socket = inject(LIVE_UPDATES_SOCKET);
  private readonly _credentials = inject(CredentialsService);
  private readonly _authentication = inject(AuthenticationService);
  private readonly _changes = new Subject<ResourceChange>();
  private readonly _reconnected = new Subject<void>();
  private _connectedBefore = false;
  private _refreshTried = false;

  // Refreshed tokens keep the session; another user or role starts a new one
  private readonly _session = computed(() => {
    const user = this._credentials.credentials?.user;
    return user ? `${user.id} ${user.role}` : null;
  });

  constructor() {
    // Read on every (re)connection, so it sends the current access token
    this._socket.auth = (cb) =>
      cb({ token: this._credentials.credentials?.accessToken });
    this._socket.on(RESOURCE_CHANGED, (change) => this._changes.next(change));
    this._socket.on("connect", () => {
      this._refreshTried = false;
      if (this._connectedBefore) this._reconnected.next();
      this._connectedBefore = true;
    });
    this._socket.on("connect_error", (error) => this._onConnectError(error));
    effect(() => {
      const session = this._session();
      this._socket.disconnect();
      if (session) this._socket.connect();
    });
  }

  /** The changes of a resource, and one after each reconnection. */
  changes(resource: RESOURCE): Observable<ResourceChange> {
    return merge(
      this._changes.pipe(filter((change) => change.resource === resource)),
      this._reconnected.pipe(map(() => ({ resource }))),
    );
  }

  // A refused handshake isn't retried by Socket.IO. The access token may
  // have expired: refresh it once, then connect again. A failed refresh is
  // left to the HTTP requests, which log out
  private _onConnectError(error: Error) {
    if (error.message !== "Unauthorized" || this._refreshTried) return;
    this._refreshTried = true;
    this._authentication
      .refresh()
      .subscribe({ next: () => this._socket.connect(), error: noop });
  }
}

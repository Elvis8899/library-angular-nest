import { ApplicationRef } from "@angular/core";
import { Credentials, ROLE } from "@app/models/credentials.entity";
import { AuthenticationService } from "@app/services/authentication.service";
import { CredentialsService } from "@app/services/credentials.service";
import {
  LIVE_UPDATES_SOCKET,
  LiveUpdatesService,
  RESOURCE,
  ResourceChange,
} from "@app/services/liveUpdates.service";
import { FakeSocket } from "@app/shared/utils/test/fakeSocket";
import {
  createServiceFactory,
  SpectatorService,
} from "@openng/spectator/vitest";
import { of, throwError } from "rxjs";
import { Socket } from "socket.io-client";

const credentialsOf = (
  id: string,
  accessToken = `access-${id}`,
  role: typeof ROLE.ADMIN | typeof ROLE.CLIENT = ROLE.ADMIN,
): Credentials => ({
  accessToken,
  refreshToken: "refresh",
  user: { id, name: id, email: `${id}@example.com`, role },
});

describe("LiveUpdatesService", () => {
  let spectator: SpectatorService<LiveUpdatesService>;
  let socket: FakeSocket;
  const refresh = vi.fn();
  const createService = createServiceFactory({
    service: LiveUpdatesService,
    providers: [
      {
        provide: LIVE_UPDATES_SOCKET,
        useFactory: () => (socket = new FakeSocket()),
      },
      { provide: AuthenticationService, useValue: { refresh } },
    ],
  });

  const credentials = () => spectator.inject(CredentialsService);
  // Root effects run when the application ticks
  const tick = () => spectator.inject(ApplicationRef).tick();
  const start = (logged: Credentials | null = credentialsOf("ana")) => {
    if (logged) localStorage.setItem("credentials", JSON.stringify(logged));
    spectator = createService();
    tick();
  };
  const collect = (resource: RESOURCE) => {
    const received: ResourceChange[] = [];
    spectator.service.changes(resource).subscribe((c) => received.push(c));
    return received;
  };

  beforeEach(() => {
    localStorage.clear();
    refresh.mockReset();
  });

  it("Should connect while logged in, sending the current access token", () => {
    start();

    expect(socket.connect).toHaveBeenCalledTimes(1);
    expect(socket.token()).toBe("access-ana");

    credentials().setCredentials(credentialsOf("ana", "access-2"));
    tick();
    expect(socket.token()).toBe("access-2");
    // The same session: refreshed tokens don't reconnect
    expect(socket.connect).toHaveBeenCalledTimes(1);
  });

  it("Should not connect while logged out, and disconnect on logout", () => {
    start(null);
    expect(socket.connect).not.toHaveBeenCalled();
    expect(socket.token()).toBeUndefined();

    credentials().setCredentials(credentialsOf("ana"));
    tick();
    expect(socket.connected).toBe(true);

    credentials().clearCredentials();
    tick();
    expect(socket.connected).toBe(false);
    expect(socket.connect).toHaveBeenCalledTimes(1);
  });

  it("Should reconnect as another user or role, which joins other rooms", () => {
    start();

    credentials().setCredentials(credentialsOf("bia"));
    tick();
    credentials().setCredentials(credentialsOf("bia", "x", ROLE.CLIENT));
    tick();

    expect(socket.disconnect).toHaveBeenCalledTimes(3);
    expect(socket.connect).toHaveBeenCalledTimes(3);
  });

  it("Should pass on the changes of the resource asked for", () => {
    start();
    const users = collect(RESOURCE.USERS);

    // Lending example: another resource
    socket.serverSends("resource.changed", { resource: RESOURCE.BOOKS });
    socket.serverSends("resource.changed", {
      resource: RESOURCE.USERS,
      key: "id",
    });

    expect(users).toEqual([{ resource: RESOURCE.USERS, key: "id" }]);
  });

  it("Should tell every screen to reload after a reconnection", () => {
    start();
    const users = collect(RESOURCE.USERS);
    // Lending example: another resource
    const books = collect(RESOURCE.BOOKS);

    socket.serverSends("connect");

    expect(users).toEqual([{ resource: RESOURCE.USERS }]);
    expect(books).toEqual([{ resource: RESOURCE.BOOKS }]);
  });

  it("Should refresh an expired token once, then connect again", () => {
    refresh.mockReturnValue(of(credentialsOf("ana")));
    start(null);
    socket.refuseNext("Unauthorized");

    credentials().setCredentials(credentialsOf("ana"));
    tick();

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(socket.connect).toHaveBeenCalledTimes(2);
    expect(socket.connected).toBe(true);
  });

  it("Should not refresh again before a connection succeeds", () => {
    refresh.mockReturnValue(of(credentialsOf("ana")));
    start(null);
    // Refused again with the refreshed token
    socket.refuseNext("Unauthorized", "Unauthorized");

    credentials().setCredentials(credentialsOf("ana"));
    tick();

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(socket.connect).toHaveBeenCalledTimes(2);
    expect(socket.connected).toBe(false);
  });

  it("Should leave a failed refresh, and other errors, alone", () => {
    refresh.mockReturnValue(throwError(() => new Error("Logged out")));
    start();

    socket.serverSends("connect_error", new Error("xhr poll error"));
    expect(refresh).not.toHaveBeenCalled();

    socket.serverSends("connect_error", new Error("Unauthorized"));
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(socket.connect).toHaveBeenCalledTimes(1);
  });
});

describe("LIVE_UPDATES_SOCKET", () => {
  const createService = createServiceFactory({ service: CredentialsService });

  it("Should reach the API's gateway on the page's host, on demand", () => {
    const spectator = createService();
    const socket: Socket = spectator.inject(LIVE_UPDATES_SOCKET);

    expect(socket.io.opts.path).toBe("/v1/socket.io");
    expect(socket.connected).toBe(false);
  });
});

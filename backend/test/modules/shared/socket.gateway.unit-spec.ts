import { RequestJWTPayload } from "@modules/auth/guards/authenticatedRequest";
import { UserRoleEnum } from "@modules/user/domain/user.entity";
import {
  Resource,
  RESOURCE_CHANGED,
} from "@shared/domainEventPublisher/resourceChanged.event";
import { SocketGateway, SocketServer } from "@shared/socket/socket.gateway";
import { SocketAuthService } from "@shared/socket/socketAuth.service";
import { FPF } from "@shared/utils/application/monads";

type Middleware = (
  socket: { handshake: { auth: unknown }; data: Partial<{ user: unknown }> },
  next: (error?: Error) => void,
) => void;

describe("[Unit] Socket gateway", () => {
  const user: RequestJWTPayload = FPF.unsafeCoerce({
    sub: "user-id",
    role: UserRoleEnum.Admin,
  });
  const authenticate = vi.fn(() => Promise.resolve(user));
  const toRooms = { emit: vi.fn() };
  const server = { use: vi.fn(), emit: vi.fn(), to: vi.fn(() => toRooms) };
  let gateway: SocketGateway;

  beforeEach(() => {
    vi.clearAllMocks();
    gateway = new SocketGateway(
      FPF.unsafeCoerce<Partial<SocketAuthService>, SocketAuthService>({
        authenticate,
      }),
    );
    Object.assign(gateway, { server });
  });

  // Registers the handshake middleware and runs it for one socket
  const handshake = async (auth: unknown) => {
    gateway.afterInit(FPF.unsafeCoerce<typeof server, SocketServer>(server));
    const [[middleware]] = FPF.unsafeCoerce<unknown, [[Middleware]]>(
      server.use.mock.calls,
    );
    const socket = { handshake: { auth }, data: {} };
    const error = await new Promise<Error | undefined>((resolve) => {
      middleware(socket, resolve);
    });
    return { error, socket };
  };

  it("Should accept a handshake that authenticates, keeping its user", async () => {
    const { error, socket } = await handshake({ token: "token" });

    expect(error).toBeUndefined();
    expect(authenticate).toHaveBeenCalledWith({ token: "token" });
    expect(socket.data).toEqual({ user });
  });

  it("Should refuse a handshake that does not authenticate", async () => {
    authenticate.mockRejectedValueOnce(new Error("invalid"));

    const { error } = await handshake({});

    expect(error?.message).toBe("Unauthorized");
  });

  it("Should join the rooms of the token's role on connection", async () => {
    const join = vi.fn();

    await gateway.handleConnection(FPF.unsafeCoerce({ data: { user }, join }));

    expect(join).toHaveBeenCalledWith(["admins"]);
  });

  it("Should send the admins' change to their room", () => {
    const change = { resource: Resource.Users, key: "id" };

    gateway.handleResourceChanged(change);

    expect(server.to).toHaveBeenCalledWith(["admins"]);
    expect(toRooms.emit).toHaveBeenCalledWith(RESOURCE_CHANGED, change);
    expect(server.emit).not.toHaveBeenCalled();
  });

  it("Should send a change without rooms to everyone", () => {
    // Lending example: the only resources everyone reads
    const change = { resource: Resource.Books };

    gateway.handleResourceChanged(change);

    expect(server.emit).toHaveBeenCalledWith(RESOURCE_CHANGED, change);
    expect(server.to).not.toHaveBeenCalled();
  });
});

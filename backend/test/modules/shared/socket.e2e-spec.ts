import { RequestJWTPayload } from "@modules/auth/guards/authenticatedRequest";
import { UserRoleEnum } from "@modules/user/domain/user.entity";
import { JwtService } from "@nestjs/jwt";
import { DomainEventPublisher } from "@shared/domainEventPublisher/domainEventPublisher";
import {
  Resource,
  RESOURCE_CHANGED,
  ResourceChange,
  resourceChanged,
} from "@shared/domainEventPublisher/resourceChanged.event";
import { executeTask } from "@shared/utils/application/executeTask";
import { createTestId, TableNameEnum } from "@test/util/defaultIds";
import { useE2eApp } from "@test/util/e2eApp";
import { io, Socket } from "socket.io-client";
import { z } from "zod";

// Real sockets against the listening app, with access tokens signed by its
// JwtService
const e2e = useE2eApp();
let url: string;
const sockets: Socket[] = [];

const tokenFor = (role: UserRoleEnum, index: number) =>
  e2e.get(JwtService).signAsync({
    sub: createTestId(TableNameEnum.User, index),
    email: `user${index.toString()}@example.com`,
    role,
  } satisfies Partial<RequestJWTPayload>);

const open = (auth: Record<string, unknown>) => {
  const socket = io(url, {
    path: "/v1/socket.io",
    transports: ["websocket"],
    reconnection: false,
    auth,
  });
  sockets.push(socket);
  return socket;
};

// Resolves "connected", or the message of the handshake's connect_error
const connect = (auth: Record<string, unknown>) =>
  new Promise<{ socket: Socket; result: string }>((resolve) => {
    const socket = open(auth);
    socket.on("connect", () => {
      resolve({ socket, result: "connected" });
    });
    socket.on("connect_error", (error) => {
      resolve({ socket, result: error.message });
    });
  });

const connectAs = async (role: UserRoleEnum, index: number) => {
  const { socket, result } = await connect({
    token: await tokenFor(role, index),
  });
  expect(result).toBe("connected");
  const received: ResourceChange[] = [];
  socket.on(RESOURCE_CHANGED, (change: unknown) => {
    received.push(ResourceChangeBody.parse(change));
  });
  return received;
};

const ResourceChangeBody = z.object({
  resource: z.enum(Resource),
  key: z.string().optional(),
});

const publish = (change: ResourceChange) =>
  executeTask(
    e2e.get(DomainEventPublisher).publishEvent(resourceChanged(change)),
  );

beforeAll(async () => {
  // The Socket.IO server only answers on a listening app
  await e2e.app.listen(0, "127.0.0.1");
  const { port } = z
    .object({ port: z.number() })
    .parse(e2e.app.getHttpServer().address());
  url = `http://127.0.0.1:${String(port)}`;
});

afterEach(() => {
  sockets.splice(0).forEach((socket) => socket.disconnect());
});

describe("[e2e] Socket", () => {
  it("Should refuse a handshake without a token, or with an invalid one", async () => {
    await expect(connect({})).resolves.toMatchObject({
      result: "Unauthorized",
    });
    await expect(connect({ token: "not-a-jwt" })).resolves.toMatchObject({
      result: "Unauthorized",
    });
  });

  it("Should send the accounts' changes to the admins only, the others to everyone", async () => {
    const admin = await connectAs(UserRoleEnum.Admin, 1);
    const client = await connectAs(UserRoleEnum.Client, 2);
    const users = { resource: Resource.Users, key: "id" };
    // Lending example: the only resources everyone reads
    const books = { resource: Resource.Books };

    await publish(users);
    // A later change for everyone, so the client's socket gets one too
    await publish(books);

    await vi.waitFor(() => {
      expect(admin).toEqual([users, books]);
      expect(client).toEqual([books]);
    });
  });
});

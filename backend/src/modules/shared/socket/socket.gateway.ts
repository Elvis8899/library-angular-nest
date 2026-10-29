import { LIVE_UPDATES_PATH, LiveUpdateEvents } from "@library/contracts";
import { RequestJWTPayload } from "@modules/auth/guards/authenticatedRequest";
import {
  OnGatewayConnection,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { OnDomainEvent } from "@shared/domainEventPublisher/onDomainEvent";
import {
  RESOURCE_CHANGED,
  ResourceChange,
} from "@shared/domainEventPublisher/resourceChanged.event";
import { SocketAuthService } from "@shared/socket/socketAuth.service";
import { roomsFor, roomsOf } from "@shared/socket/socketRooms";
import { Server, Socket } from "socket.io";

type ServerEvents = LiveUpdateEvents;
interface SocketData {
  user: RequestJWTPayload;
}
export type SocketServer = Server<
  Record<string, never>,
  ServerEvents,
  Record<string, never>,
  SocketData
>;
export type AuthenticatedSocket = Socket<
  Record<string, never>,
  ServerEvents,
  Record<string, never>,
  SocketData
>;

// Same origin as the API (nginx in production, the dev server's proxy), so
// no CORS
@WebSocketGateway({ path: LIVE_UPDATES_PATH })
export class SocketGateway implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer()
  private server!: SocketServer;

  constructor(private readonly socketAuthService: SocketAuthService) {}

  // A connection without a valid access token is refused in the handshake:
  // the client gets a connect_error and no events
  afterInit(server: SocketServer): void {
    server.use((socket, next) => {
      this.socketAuthService.authenticate(socket.handshake.auth).then(
        (user) => {
          socket.data.user = user;
          next();
        },
        () => {
          next(new Error("Unauthorized"));
        },
      );
    });
  }

  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    await client.join(roomsOf(client.data.user));
  }

  @OnDomainEvent(RESOURCE_CHANGED)
  handleResourceChanged(change: ResourceChange): void {
    const rooms = roomsFor(change);
    (rooms === null ? this.server : this.server.to(rooms)).emit(
      RESOURCE_CHANGED,
      change,
    );
  }
}

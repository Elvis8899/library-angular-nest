import { Module } from "@nestjs/common";
import { SocketGateway } from "@shared/socket/socket.gateway";
import { SocketAuthService } from "@shared/socket/socketAuth.service";

// Tells the clients what changed (`resource.changed`), so their screens reload
@Module({
  providers: [SocketGateway, SocketAuthService],
})
export class SocketModule {}

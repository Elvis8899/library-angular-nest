import { AuditModule } from "@modules/audit/audit.module";
import { AuthModule } from "@modules/auth/auth.module";
import { BookModule } from "@modules/book/book.module";
import { RentalModule } from "@modules/rental/rental.module";
import { UserModule } from "@modules/user/user.module";
import { DynamicModule, ForwardReference, Module, Type } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { CqrsModule } from "@nestjs/cqrs";
import { AuditLogModule } from "@shared/audit/auditLog.module";
import { ClockModule } from "@shared/clock/clock.module";
import { LoggerModule } from "@shared/logger/logger.module";
import { MetricsModule } from "@shared/metrics/metrics.module";
import { PrismaModule } from "@shared/prisma/prisma.module";
import { SocketModule } from "@shared/socket/socket.module";
import { StorageModule } from "@shared/storage/storage.module";
import { UseCaseModule } from "@shared/utils/application/useCase.module";
import { AppController } from "@src/app.controller";

type NestModuleImport =
  Type | DynamicModule | Promise<DynamicModule> | ForwardReference;
// SubModule used by the server
const appModules: NestModuleImport[] = [
  CqrsModule,
  LoggerModule,
  UseCaseModule,
  AuditLogModule,
  ClockModule,
  MetricsModule,
  ConfigModule.forRoot({
    isGlobal: true,
  }),
  PrismaModule,
  SocketModule,
  StorageModule,
  //
  AuthModule,
  //
  UserModule,
  AuditModule,
  // Lending example
  BookModule,
  RentalModule,
];

// Infrastructure Modules (DB, config) used by the server
const infrastructureModules: NestModuleImport[] = [];

const controllers = [AppController];
@Module({
  imports: [...appModules, ...infrastructureModules],
  controllers: [...controllers],
  providers: [],
})
export class AppModule {}

import { DynamicModule, ForwardReference, Module, Type } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { CqrsModule } from "@nestjs/cqrs";
import { DomainEventPublisherModule } from "@shared/domain-event-publisher/domainEventPublisher.module";
import { LoggerModule } from "@shared/logger/logger.module";
import { PrismaModule } from "@shared/prisma/prisma.module";
import { AppController } from "@src/app.controller";
import { LoginModule } from "@src/modules/auth/login.module";
import { BookInfoModule } from "@src/modules/book/bookInfo.module";
import { BookRentalModule } from "@src/modules/rental/bookRental.module";
import { UserModule } from "@src/modules/user/user.module";

type NestModuleImport =
  | Type
  | DynamicModule
  | Promise<DynamicModule>
  | ForwardReference;
// SubModule used by the server
const appModules: NestModuleImport[] = [
  CqrsModule,
  LoggerModule,
  DomainEventPublisherModule,
  ConfigModule.forRoot({
    isGlobal: true,
  }),
  PrismaModule,
  //
  LoginModule,
  //
  UserModule,
  BookInfoModule,
  BookRentalModule,
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

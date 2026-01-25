import { DynamicModule, ForwardReference, Module, Type } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "@src/app.controller";
import { LoggerModule } from "@src/shared/logger/logger.module";
import { PrismaModule } from "@src/shared/prisma/prisma.module";
import { CqrsModule } from "@nestjs/cqrs";
import { DomainEventPublisherModule } from "@shared/domain-event-publisher/domainEventPublisher.module";
import { UserModule } from "./modules/user/user.module";
import { BookInfoModule } from "./modules/book/bookInfo.module";
import { LoginModule } from "./modules/auth/login.module";
import { BookRentalModule } from "./modules/rental/bookRental.module";

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

import { LoginModule } from "@auth/login.module";
import { BookInfoModule } from "@book/bookInfo.module";
import { DynamicModule, ForwardReference, Module, Type } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { CqrsModule } from "@nestjs/cqrs";
import { BookRentalModule } from "@rental/bookRental.module";
import { DomainEventPublisherModule } from "@shared/domain-event-publisher/domainEventPublisher.module";
import { LoggerModule } from "@shared/logger/logger.module";
import { PrismaModule } from "@shared/prisma/prisma.module";
import { AppController } from "@src/app.controller";
import { UserModule } from "@user/user.module";

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

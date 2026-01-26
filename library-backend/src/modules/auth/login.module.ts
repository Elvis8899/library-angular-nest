import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { authConfig } from "./auth.config";
import { UserRepository } from "../user/database/user.repository.port";
import { RealUserRepository } from "../user/database/realUser.repository";
import { LoginCommandHandler } from "./commands/login/login.command";
import { LoginController } from "./commands/login/login.controller";
import { CqrsModule } from "@nestjs/cqrs";

const controllers = [LoginController];
const commandHandlers = [LoginCommandHandler];
// const queryHandlers = [
//   //
// ];
// const subscribers = [EndpointReponseSubscriber];
// const services = [
//   //
// ];
const repositories = [
  {
    provide: UserRepository,
    useClass: RealUserRepository,
  },
];

@Module({
  imports: [
    CqrsModule,
    JwtModule.registerAsync({
      global: true,
      useFactory: () => {
        return authConfig;
      },
    }),
  ],
  controllers: [...controllers],
  providers: [
    //...controllers,
    ...commandHandlers,
    // ...queryHandlers,
    // ...services,
    ...repositories,
    // ...subscribers,
  ],
})
export class LoginModule {}

import { authConfig } from "@auth/auth.config";
import { LoginCommandHandler } from "@auth/commands/login/login.command";
import { LoginController } from "@auth/commands/login/login.controller";
import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { JwtModule } from "@nestjs/jwt";
import { RealUserRepository } from "@user/database/realUser.repository";
import { UserRepository } from "@user/database/user.repository.port";

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

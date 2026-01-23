import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { RealUUIDGeneratorService } from "@src/shared/uuid/adapters/secondaries/realUUIDGenerator.service";
import { UserRepository } from "./database/user.repository.port";
import { CreateUserHandler } from "./commands/createUser/createUser.command";
import { RealUserRepository } from "./database/realUser.repository";
import { CreateUserController } from "./commands/createUser/createUser.controller";
import { UpdateUserController } from "./commands/updateUser/updateUser.controller";
import { DeleteUserController } from "./commands/deleteUser/deleteUser.controller";
import { UpdateUserHandler } from "./commands/updateUser/updateUser.command";
import { DeleteUserHandler } from "./commands/deleteUser/deleteUser.command";
import { PaginatedUsersQueryHandler } from "./queries/paginatedUsers/paginatedUsers.query";
import { PaginatedUserController } from "./queries/paginatedUsers/paginatedUsers.controller";
import { GetUserByIdController } from "./queries/getUserById/getUserById.controller";
import { GetUserByIdQueryHandler } from "./queries/getUserById/getUserById.query";

const controllers = [
  CreateUserController,
  UpdateUserController,
  DeleteUserController,
  PaginatedUserController,
  GetUserByIdController,
];
const commandHandlers = [
  CreateUserHandler,
  UpdateUserHandler,
  DeleteUserHandler,
];
const queryHandlers = [PaginatedUsersQueryHandler, GetUserByIdQueryHandler];
// const subscribers = [EndpointReponseSubscriber];
const services = [RealUUIDGeneratorService];
const repositories = [
  {
    provide: UserRepository,
    useClass: RealUserRepository,
  },
];

@Module({
  imports: [CqrsModule],
  controllers: [...controllers],
  providers: [
    //...controllers,
    ...commandHandlers,
    ...queryHandlers,
    ...services,
    ...repositories,
    // ...subscribers,
  ],
})
export class UserModule {}

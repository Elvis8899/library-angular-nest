import { CreateUserHandler } from "@modules/user/commands/createUser/createUser.command";
import { CreateUserController } from "@modules/user/commands/createUser/createUser.controller";
import { DeactivateUserHandler } from "@modules/user/commands/deactivateUser/deactivateUser.command";
import { DeactivateUserController } from "@modules/user/commands/deactivateUser/deactivateUser.controller";
import { DeleteUserHandler } from "@modules/user/commands/deleteUser/deleteUser.command";
import { DeleteUserController } from "@modules/user/commands/deleteUser/deleteUser.controller";
import { ReactivateUserHandler } from "@modules/user/commands/reactivateUser/reactivateUser.command";
import { ReactivateUserController } from "@modules/user/commands/reactivateUser/reactivateUser.controller";
import { UpdateUserHandler } from "@modules/user/commands/updateUser/updateUser.command";
import { UpdateUserController } from "@modules/user/commands/updateUser/updateUser.controller";
import { RealUserRepository } from "@modules/user/database/realUser.repository";
import { UserRepository } from "@modules/user/database/user.repository.port";
import { PasswordHasher } from "@modules/user/domain/passwordHasher.port";
import { GetUserByIdController } from "@modules/user/queries/getUserById/getUserById.controller";
import { GetUserByIdQueryHandler } from "@modules/user/queries/getUserById/getUserById.query";
import { PaginatedUserController } from "@modules/user/queries/paginatedUsers/paginatedUsers.controller";
import { PaginatedUsersQueryHandler } from "@modules/user/queries/paginatedUsers/paginatedUsers.query";
import { BcryptPasswordHasher } from "@modules/user/utils/bcryptPasswordHasher";
import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { RealUUIDGeneratorService } from "@shared/uuid/realUUIDGenerator.service";

const controllers = [
  CreateUserController,
  UpdateUserController,
  DeleteUserController,
  DeactivateUserController,
  ReactivateUserController,
  PaginatedUserController,
  GetUserByIdController,
];
const commandHandlers = [
  CreateUserHandler,
  UpdateUserHandler,
  DeleteUserHandler,
  DeactivateUserHandler,
  ReactivateUserHandler,
];
const queryHandlers = [PaginatedUsersQueryHandler, GetUserByIdQueryHandler];
const services = [
  RealUUIDGeneratorService,
  { provide: PasswordHasher, useClass: BcryptPasswordHasher },
];
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
    ...commandHandlers,
    ...queryHandlers,
    ...services,
    ...repositories,
  ],
  // For the auth module, which logs users in
  exports: [UserRepository, PasswordHasher],
})
export class UserModule {}

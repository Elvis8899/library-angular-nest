import { contractRef, UserRequest } from "@library/contracts";
import { ApiController } from "@modules/auth/decorators/apiController.decorator";
import { Roles } from "@modules/auth/decorators/roles.decorator";
import { RolesGuard } from "@modules/auth/guards/roles.guard";
import { CreateUser } from "@modules/user/commands/createUser/createUser.command";
import { UserRoleEnum } from "@modules/user/domain/user.entity";
import {
  UserCPFAlreadyExistsException,
  UserEmailAlreadyExistsException,
} from "@modules/user/domain/user.errors";
import { Body, HttpCode, HttpStatus, Post, UseGuards } from "@nestjs/common";
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOperation,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { CommandBus } from "@shared/utils/application/cqrs";
import { ApiErrors } from "@shared/utils/http/apiErrors";

@ApiController("Usuários")
export class CreateUserController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post("users")
  @ApiErrors(UserCPFAlreadyExistsException, UserEmailAlreadyExistsException)
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.Admin)
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({ schema: contractRef(UserRequest) })
  @ApiOperation({
    summary: "Cria um Usuário.",
    description: `Dado um Usuário válido, ele será criado.`,
  })
  @ApiCreatedResponse({ description: "Usuário criado com sucesso." })
  @ApiUnprocessableEntityResponse({ description: "Usuário inválido." })
  async createUser(@Body() createUserDto: UserRequest): Promise<void> {
    return this.commandBus.execute(new CreateUser(createUserDto));
  }
}

import { contractRef, UserRequest } from "@library/contracts";
import { Roles } from "@modules/auth/decorators/roles.decorator";
import { AuthGuard } from "@modules/auth/guards/auth.guard";
import { RolesGuard } from "@modules/auth/guards/roles.guard";
import { CreateUser } from "@modules/user/commands/createUser/createUser.command";
import { UserRoleEnum } from "@modules/user/domain/user.entity";
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import {
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { noop } from "@shared/utils/application/noop";

@Controller("v1/")
@ApiBearerAuth()
@UseGuards(AuthGuard)
@ApiTags("Usuários")
export class CreateUserController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post("users")
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
  @ApiConflictResponse({ description: "Usuário já existe." })
  async createUser(@Body() createUserDto: UserRequest): Promise<void> {
    return this.commandBus
      .execute<CreateUser>(new CreateUser(createUserDto))
      .then(noop);
  }
}

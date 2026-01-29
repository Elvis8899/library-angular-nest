import { Roles } from "@auth/decorators/roles.decorator";
import { AuthGuard } from "@auth/guards/auth.guard";
import { RolesGuard } from "@auth/guards/roles.guard";
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
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { noop } from "@shared/utils/application/noop";
import { CreateUser } from "@user/commands/createUser/createUser.command";
import { UserRoleEnum } from "@user/domain/user.entity";
import { CreateUserDto } from "@user/dtos/user.dto";

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
  @ApiOperation({
    summary: "Cria um Usuário.",
    description: `Dado um Usuário válido, ele será criado.`,
  })
  @ApiCreatedResponse({ description: "Usuário criado com sucesso." })
  @ApiUnprocessableEntityResponse({ description: "Usuário inválido." })
  @ApiConflictResponse({ description: "Usuário já existe." })
  async createUser(@Body() createUserDto: CreateUserDto): Promise<void> {
    return this.commandBus
      .execute<CreateUser>(new CreateUser(createUserDto))
      .then(noop);
  }
}

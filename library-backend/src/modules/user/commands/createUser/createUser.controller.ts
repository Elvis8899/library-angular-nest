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
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
  ApiCreatedResponse,
  ApiConflictResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { noop } from "@shared/utils/noop";
import { CreateUserDto } from "../../dtos/user.dto";
import { CreateUser } from "./createUser.command";
import { RolesGuard } from "@src/modules/auth/guards/roles.guard";
import { Roles } from "@src/modules/auth/decorators/roles.decorator";
import { UserRoleEnum } from "../../domain/user.entity";
import { AuthGuard } from "@src/modules/auth/guards/auth.guard";

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

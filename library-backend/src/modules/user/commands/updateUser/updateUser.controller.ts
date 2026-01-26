import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  UseGuards,
} from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import {
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { noop } from "@shared/utils/noop";
import { CreateUserDto } from "../../dtos/user.dto";
import { UpdateUser } from "./updateUser.command";
import { RolesGuard } from "@src/modules/auth/guards/roles.guard";
import { Roles } from "@src/modules/auth/decorators/roles.decorator";
import { UserRoleEnum } from "../../domain/user.entity";
import { AuthGuard } from "@src/modules/auth/guards/auth.guard";

@Controller("v1/")
@ApiBearerAuth()
@UseGuards(AuthGuard)
@ApiTags("Usuários")
export class UpdateUserController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Put("users/:id")
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.Admin)
  @HttpCode(HttpStatus.OK)
  @ApiCreatedResponse({ description: "Usuário atualizado com sucesso." })
  @ApiUnprocessableEntityResponse({ description: "Usuário inválido." })
  @ApiNotFoundResponse({ description: "Usuário não encontrado." })
  @ApiOperation({ summary: "Atualizar Usuário" })
  async updateUser(
    @Body() updateModuleDto: CreateUserDto,
    @Param("id") id: string,
  ): Promise<void> {
    return this.commandBus
      .execute(new UpdateUser(updateModuleDto, id))
      .then(noop);
  }
}

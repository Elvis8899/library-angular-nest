import { Roles } from "@modules/auth/decorators/roles.decorator";
import { AuthGuard } from "@modules/auth/guards/auth.guard";
import { RolesGuard } from "@modules/auth/guards/roles.guard";
import { UpdateUser } from "@modules/user/commands/updateUser/updateUser.command";
import { UserRoleEnum } from "@modules/user/domain/user.entity";
import { UpdateUserDto } from "@modules/user/dtos/user.dto";
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
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { noop } from "@shared/utils/application/noop";

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
    @Body() updateModuleDto: UpdateUserDto,
    @Param("id") id: string,
  ): Promise<void> {
    return this.commandBus
      .execute(new UpdateUser(updateModuleDto, id))
      .then(noop);
  }
}

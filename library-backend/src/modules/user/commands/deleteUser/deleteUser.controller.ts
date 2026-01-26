import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  UseGuards,
} from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import {
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
  ApiNotFoundResponse,
  ApiDefaultResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { noop } from "@shared/utils/noop";
import { DeleteUser } from "./deleteUser.command";
import { RolesGuard } from "@src/modules/auth/guards/roles.guard";
import { UserRoleEnum } from "../../domain/user.entity";
import { Roles } from "@src/modules/auth/decorators/roles.decorator";
import { AuthGuard } from "@src/modules/auth/guards/auth.guard";

@Controller("v1/")
@ApiBearerAuth()
@UseGuards(AuthGuard)
@ApiTags("Usuários")
export class DeleteUserController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Delete("users/:id")
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.Admin)
  @HttpCode(HttpStatus.OK)
  @ApiNotFoundResponse({ description: "Usuário não encontrado." })
  @ApiUnprocessableEntityResponse({ description: "Id inválido." })
  @ApiDefaultResponse({ description: "Usuário excluído com sucesso." })
  @ApiOperation({ summary: "Deletar Usuário" })
  async deleteUser(@Param("id") userId: string): Promise<void> {
    return this.commandBus
      .execute<DeleteUser>(new DeleteUser(userId))
      .then(noop);
  }
}

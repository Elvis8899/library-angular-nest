import { ApiController } from "@modules/auth/decorators/apiController.decorator";
import { Roles } from "@modules/auth/decorators/roles.decorator";
import { RolesGuard } from "@modules/auth/guards/roles.guard";
import { ReactivateUser } from "@modules/user/commands/reactivateUser/reactivateUser.command";
import { UserRoleEnum } from "@modules/user/domain/user.entity";
import { UserNotFoundException } from "@modules/user/domain/user.errors";
import { HttpCode, HttpStatus, Param, Post, UseGuards } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import {
  ApiDefaultResponse,
  ApiOperation,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { noop } from "@shared/utils/application/noop";
import { ApiErrors } from "@shared/utils/http/apiErrors";

@ApiController("Usuários")
export class ReactivateUserController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post("users/:id/reactivate")
  @ApiErrors(UserNotFoundException)
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.Admin)
  @HttpCode(HttpStatus.OK)
  @ApiUnprocessableEntityResponse({ description: "Id inválido." })
  @ApiDefaultResponse({ description: "Usuário reativado com sucesso." })
  @ApiOperation({
    summary: "Reativar Usuário",
    description: "A conta volta a entrar.",
  })
  async reactivateUser(@Param("id") id: string): Promise<void> {
    return this.commandBus
      .execute<ReactivateUser>(new ReactivateUser(id))
      .then(noop);
  }
}

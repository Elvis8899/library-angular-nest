import { ApiController } from "@modules/auth/decorators/apiController.decorator";
import { Roles } from "@modules/auth/decorators/roles.decorator";
import { AuthenticatedRequest } from "@modules/auth/guards/authenticatedRequest";
import { RolesGuard } from "@modules/auth/guards/roles.guard";
import { DeactivateUser } from "@modules/user/commands/deactivateUser/deactivateUser.command";
import { UserRoleEnum } from "@modules/user/domain/user.entity";
import {
  UserDeactivatesSelfException,
  UserNotFoundException,
} from "@modules/user/domain/user.errors";
import { HttpCode, HttpStatus, Param, Post, Request, UseGuards } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import {
  ApiDefaultResponse,
  ApiOperation,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { noop } from "@shared/utils/application/noop";
import { ApiErrors } from "@shared/utils/http/apiErrors";

@ApiController("Usuários")
export class DeactivateUserController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post("users/:id/deactivate")
  @ApiErrors(UserNotFoundException, UserDeactivatesSelfException)
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.Admin)
  @HttpCode(HttpStatus.OK)
  @ApiUnprocessableEntityResponse({ description: "Id inválido." })
  @ApiDefaultResponse({ description: "Usuário desativado com sucesso." })
  @ApiOperation({
    summary: "Desativar Usuário",
    description: "A conta deixa de entrar e suas sessões terminam. O que ela registrou continua apontando para ela.",
  })
  async deactivateUser(    @Param("id") id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<void> {
    return this.commandBus
      .execute<DeactivateUser>(new DeactivateUser(id, req.user.sub))
      .then(noop);
  }
}

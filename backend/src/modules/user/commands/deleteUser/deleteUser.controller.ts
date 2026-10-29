import { ApiController } from "@modules/auth/decorators/apiController.decorator";
import { Roles } from "@modules/auth/decorators/roles.decorator";
import { RolesGuard } from "@modules/auth/guards/roles.guard";
import { DeleteUser } from "@modules/user/commands/deleteUser/deleteUser.command";
import { UserRoleEnum } from "@modules/user/domain/user.entity";
import {
  UserHasActiveRentalsException,
  UserNotFoundException,
} from "@modules/user/domain/user.errors";
import { Delete, HttpCode, HttpStatus, Param, UseGuards } from "@nestjs/common";
import {
  ApiDefaultResponse,
  ApiOperation,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { CommandBus } from "@shared/utils/application/cqrs";
import { ApiErrors } from "@shared/utils/http/apiErrors";

@ApiController("Usuários")
export class DeleteUserController {
  constructor(private readonly commandBus: CommandBus) {}

  @Delete("users/:id")
  // Lending example: UserHasActiveRentalsException
  @ApiErrors(UserNotFoundException, UserHasActiveRentalsException)
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.Admin)
  @HttpCode(HttpStatus.OK)
  @ApiUnprocessableEntityResponse({ description: "Id inválido." })
  @ApiDefaultResponse({ description: "Usuário excluído com sucesso." })
  @ApiOperation({ summary: "Deletar Usuário" })
  async deleteUser(@Param("id") userId: string): Promise<void> {
    return this.commandBus.execute(new DeleteUser(userId));
  }
}

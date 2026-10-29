import { contractRef, UserChangesRequest } from "@library/contracts";
import { ApiController } from "@modules/auth/decorators/apiController.decorator";
import { Roles } from "@modules/auth/decorators/roles.decorator";
import { RolesGuard } from "@modules/auth/guards/roles.guard";
import { UpdateUser } from "@modules/user/commands/updateUser/updateUser.command";
import { UserRoleEnum } from "@modules/user/domain/user.entity";
import {
  UserCPFAlreadyExistsException,
  UserEmailAlreadyExistsException,
  UserNotFoundException,
} from "@modules/user/domain/user.errors";
import {
  Body,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOperation,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { CommandBus } from "@shared/utils/application/cqrs";
import { ApiErrors } from "@shared/utils/http/apiErrors";

@ApiController("Usuários")
export class UpdateUserController {
  constructor(private readonly commandBus: CommandBus) {}

  @Put("users/:id")
  @ApiErrors(
    UserNotFoundException,
    UserCPFAlreadyExistsException,
    UserEmailAlreadyExistsException,
  )
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.Admin)
  @HttpCode(HttpStatus.OK)
  @ApiCreatedResponse({ description: "Usuário atualizado com sucesso." })
  @ApiUnprocessableEntityResponse({ description: "Usuário inválido." })
  @ApiOperation({ summary: "Atualizar Usuário" })
  @ApiBody({ schema: contractRef(UserChangesRequest) })
  async updateUser(
    @Body() updateModuleDto: UserChangesRequest,
    @Param("id") id: string,
  ): Promise<void> {
    return this.commandBus.execute(new UpdateUser(updateModuleDto, id));
  }
}

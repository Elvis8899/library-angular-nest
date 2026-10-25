import { contractRef, Sent, UserResponse } from "@library/contracts";
import { Roles } from "@modules/auth/decorators/roles.decorator";
import { AuthGuard } from "@modules/auth/guards/auth.guard";
import { RolesGuard } from "@modules/auth/guards/roles.guard";
import { User, UserRoleEnum } from "@modules/user/domain/user.entity";
import { toUserResponse } from "@modules/user/domain/userViews";
import { GetUserByIdQuery } from "@modules/user/queries/getUserById/getUserById.query";
import { Controller, Get, HttpStatus, Param, UseGuards } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

@Controller("v1/")
@ApiTags("Usuários")
@ApiBearerAuth()
@UseGuards(AuthGuard)
export class GetUserByIdController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get("users/:id")
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.Admin)
  @ApiOperation({ summary: "Encontrar um usuário pelo ID" })
  @ApiNotFoundResponse({ description: "Usuário não encontrado." })
  @ApiResponse({
    status: HttpStatus.OK,
    schema: contractRef(UserResponse),
  })
  async paginatedUsers(
    @Param("id") id: string,
  ): Promise<Sent<typeof UserResponse>> {
    return this.queryBus
      .execute<GetUserByIdQuery, User>(new GetUserByIdQuery(id))
      .then(toUserResponse);
  }
}

import { contractRef, Sent, UserResponse } from "@library/contracts";
import { ApiController } from "@modules/auth/decorators/apiController.decorator";
import { Roles } from "@modules/auth/decorators/roles.decorator";
import { RolesGuard } from "@modules/auth/guards/roles.guard";
import { User, UserRoleEnum } from "@modules/user/domain/user.entity";
import { UserNotFoundException } from "@modules/user/domain/user.errors";
import { toUserResponse } from "@modules/user/domain/userViews";
import { GetUserByIdQuery } from "@modules/user/queries/getUserById/getUserById.query";
import { Get, HttpStatus, Param, UseGuards } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import { ApiErrors } from "@shared/utils/http/apiErrors";

@ApiController("Usuários")
export class GetUserByIdController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get("users/:id")
  @ApiErrors(UserNotFoundException)
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.Admin)
  @ApiOperation({ summary: "Encontrar um usuário pelo ID" })
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

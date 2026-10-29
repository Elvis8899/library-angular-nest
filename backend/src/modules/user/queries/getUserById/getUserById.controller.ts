import { UserResponse } from "@library/contracts";
import { ApiController } from "@modules/auth/decorators/apiController.decorator";
import { Roles } from "@modules/auth/decorators/roles.decorator";
import { RolesGuard } from "@modules/auth/guards/roles.guard";
import { UserRoleEnum } from "@modules/user/domain/user.entity";
import { UserNotFoundException } from "@modules/user/domain/user.errors";
import { toUserResponse } from "@modules/user/domain/userViews";
import { GetUserByIdQuery } from "@modules/user/queries/getUserById/getUserById.query";
import { Get, Param, UseGuards } from "@nestjs/common";
import { ApiOperation } from "@nestjs/swagger";
import { QueryBus } from "@shared/utils/application/cqrs";
import { Answers } from "@shared/utils/http/answers";
import { ApiErrors } from "@shared/utils/http/apiErrors";

@ApiController("Usuários")
export class GetUserByIdController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get("users/:id")
  @ApiErrors(UserNotFoundException)
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.Admin)
  @ApiOperation({ summary: "Encontrar um usuário pelo ID" })
  @Answers(UserResponse)
  async paginatedUsers(@Param("id") id: string) {
    return this.queryBus.execute(new GetUserByIdQuery(id)).then(toUserResponse);
  }
}

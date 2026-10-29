import { PageQuery, QueryString, UserPage } from "@library/contracts";
import { ApiController } from "@modules/auth/decorators/apiController.decorator";
import { Roles } from "@modules/auth/decorators/roles.decorator";
import { RolesGuard } from "@modules/auth/guards/roles.guard";
import { UserRoleEnum } from "@modules/user/domain/user.entity";
import { toUserResponse } from "@modules/user/domain/userViews";
import { PaginatedUsersQuery } from "@modules/user/queries/paginatedUsers/paginatedUsers.query";
import { Get, Query, UseGuards } from "@nestjs/common";
import { ApiOperation } from "@nestjs/swagger";
import { QueryBus } from "@shared/utils/application/cqrs";
import { Answers } from "@shared/utils/http/answers";
import { ApiQueryContract } from "@shared/utils/http/apiQueryContract";

@ApiController("Usuários")
export class PaginatedUserController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get("users")
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.Admin)
  @ApiOperation({ summary: "Listar Usuários" })
  @ApiQueryContract(PageQuery)
  @Answers(UserPage)
  async paginatedUsers(
    // Parsed by the handler
    @Query() { page, limit }: QueryString<typeof PageQuery>,
  ) {
    return this.queryBus
      .execute(new PaginatedUsersQuery({ page, limit }))
      .then((result) => ({
        count: result.count,
        limit: result.limit,
        page: result.page,
        data: result.data.map(toUserResponse),
      }));
  }
}

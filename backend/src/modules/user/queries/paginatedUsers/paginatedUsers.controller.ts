import {
  contractRef,
  PageQuery,
  QueryString,
  Sent,
  UserPage,
} from "@library/contracts";
import { Roles } from "@modules/auth/decorators/roles.decorator";
import { AuthGuard } from "@modules/auth/guards/auth.guard";
import { RolesGuard } from "@modules/auth/guards/roles.guard";
import { User, UserRoleEnum } from "@modules/user/domain/user.entity";
import { toUserResponse } from "@modules/user/domain/userViews";
import { PaginatedUsersQuery } from "@modules/user/queries/paginatedUsers/paginatedUsers.query";
import { Controller, Get, HttpStatus, Query, UseGuards } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { Paginated } from "@shared/utils/database/repository.port";
import { ApiQueryContract } from "@shared/utils/http/apiQueryContract";

@Controller("v1/")
@ApiTags("Usuários")
@ApiBearerAuth()
@UseGuards(AuthGuard)
export class PaginatedUserController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get("users")
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.Admin)
  @ApiOperation({ summary: "Listar Usuários" })
  @ApiQueryContract(PageQuery)
  @ApiResponse({
    status: HttpStatus.OK,
    schema: contractRef(UserPage),
  })
  async paginatedUsers(
    // Parsed by the handler
    @Query() { page, limit }: QueryString<typeof PageQuery>,
  ): Promise<Sent<typeof UserPage>> {
    return this.queryBus
      .execute<PaginatedUsersQuery, Paginated<User>>(
        new PaginatedUsersQuery({ page, limit }),
      )
      .then((result) => ({
        count: result.count,
        limit: result.limit,
        page: result.page,
        data: result.data.map(toUserResponse),
      }));
  }
}

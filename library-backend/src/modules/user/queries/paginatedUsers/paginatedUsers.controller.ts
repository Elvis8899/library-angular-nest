import { Roles } from "@modules/auth/decorators/roles.decorator";
import { AuthGuard } from "@modules/auth/guards/auth.guard";
import { RolesGuard } from "@modules/auth/guards/roles.guard";
import { User, UserRoleEnum } from "@modules/user/domain/user.entity";
import {
  PaginatedUserResponseDto,
  toUserResponse,
} from "@modules/user/dtos/user.dto";
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
import { PaginatedQueryRequestDto } from "@shared/utils/dtos/paginatedQuery.request.dto";

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
  @ApiResponse({
    status: HttpStatus.OK,
    type: PaginatedUserResponseDto,
  })
  async paginatedUsers(
    @Query() queryParams: PaginatedQueryRequestDto,
  ): Promise<PaginatedUserResponseDto> {
    return this.queryBus
      .execute<PaginatedUsersQuery, Paginated<User>>(
        new PaginatedUsersQuery(queryParams),
      )
      .then(
        (result) =>
          new PaginatedUserResponseDto({
            count: result.count,
            limit: result.limit,
            page: result.page,
            data: result.data.map(toUserResponse),
          }),
      );
  }
}

import { Controller, Get, HttpStatus, Query, UseGuards } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import {
  ApiOperation,
  ApiTags,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { PaginatedUserResponseDto } from "../../dtos/user.dto";
import { PaginatedQueryRequestDto } from "@src/shared/api/paginated-query.request.dto";
import { PaginatedUsersQuery } from "./paginatedUsers.query";
import { RolesGuard } from "@src/modules/auth/guards/roles.guard";
import { Roles } from "@src/modules/auth/decorators/roles.decorator";
import { UserRoleEnum } from "../../domain/user.entity";
import { AuthGuard } from "@src/modules/auth/guards/auth.guard";

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
  @Roles(UserRoleEnum.Admin, UserRoleEnum.Client)
  @ApiOperation({ summary: "Listar Usuários" })
  @ApiResponse({
    status: HttpStatus.OK,
    type: PaginatedUserResponseDto,
  })
  async paginatedUsers(
    @Query() queryParams: PaginatedQueryRequestDto,
  ): Promise<PaginatedUserResponseDto> {
    return this.queryBus
      .execute<PaginatedUsersQuery>(new PaginatedUsersQuery(queryParams))
      .then((result) => new PaginatedUserResponseDto(result));
  }
}

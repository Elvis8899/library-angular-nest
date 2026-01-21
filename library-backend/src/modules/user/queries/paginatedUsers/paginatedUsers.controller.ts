import { Controller, Get, HttpStatus, Query } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { ApiOperation, ApiTags, ApiResponse } from "@nestjs/swagger";
import { PaginatedUserResponseDto } from "../../dtos/user.dto";
import { PaginatedQueryRequestDto } from "@src/shared/api/paginated-query.request.dto";
import { PaginatedUsersQuery } from "./paginatedUsers.query";

@Controller("v1/")
@ApiTags("Usuários")
export class PaginatedUserController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get("users")
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

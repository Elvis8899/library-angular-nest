import { Controller, Get, HttpStatus, Query } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { ApiOperation, ApiTags, ApiResponse } from "@nestjs/swagger";
import { PaginatedBookInfoResponseDto } from "../../dtos/bookInfo.dto";
import { PaginatedQueryRequestDto } from "@src/shared/api/paginated-query.request.dto";
import { PaginatedBookInfosQuery } from "./paginatedBookInfos.query";

@Controller("v1/")
@ApiTags("Livros")
export class PaginatedBookInfoController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get("bookInfos")
  @ApiOperation({ summary: "Listar Livros" })
  @ApiResponse({
    status: HttpStatus.OK,
    type: PaginatedBookInfoResponseDto,
  })
  async paginatedBookInfos(
    @Query() queryParams: PaginatedQueryRequestDto,
  ): Promise<PaginatedBookInfoResponseDto> {
    return this.queryBus
      .execute<PaginatedBookInfosQuery>(
        new PaginatedBookInfosQuery(queryParams),
      )
      .then((result) => new PaginatedBookInfoResponseDto(result));
  }
}

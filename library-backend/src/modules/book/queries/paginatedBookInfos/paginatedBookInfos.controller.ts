import {
  BookInfoDto,
  PaginatedBookInfoQueryRequestDto,
  PaginatedBookInfoResponseDto,
} from "@book/dtos/bookInfo.dto";
import { PaginatedBookInfosQuery } from "@book/queries/paginatedBookInfos/paginatedBookInfos.query";
import { Controller, Get, HttpStatus, Query } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { PaginatedResponseDto } from "@shared/utils/dtos/paginated.response.base";

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
    @Query() queryParams: PaginatedBookInfoQueryRequestDto,
  ): Promise<PaginatedBookInfoResponseDto> {
    return this.queryBus
      .execute<PaginatedBookInfosQuery, PaginatedResponseDto<BookInfoDto>>(
        new PaginatedBookInfosQuery(queryParams, {
          name: queryParams.name,
          createdFrom: queryParams.createdFrom,
          createdBefore: queryParams.createdBefore,
          sortBy: queryParams.sortBy,
          order: queryParams.order,
        }),
      )
      .then((result) => new PaginatedBookInfoResponseDto(result));
  }
}

import { AuthGuard } from "@auth/guards/auth.guard";
import {
  PaginatedBookInfoQueryRequestDto,
  PaginatedBookInfoResponseDto,
  toBookInfoResponse,
} from "@book/dtos/bookInfo.dto";
import { PaginatedBookInfosQuery } from "@book/queries/paginatedBookInfos/paginatedBookInfos.query";
import { Controller, Get, HttpStatus, Query, UseGuards } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { Paginated } from "@shared/utils/database/repository.port";
import { BookInfo } from "@src/modules/book/domain/bookInfo.entity";

@Controller("v1/")
@ApiBearerAuth()
@UseGuards(AuthGuard)
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
      .execute<PaginatedBookInfosQuery, Paginated<BookInfo>>(
        new PaginatedBookInfosQuery(queryParams, {
          name: queryParams.name,
          createdFrom: queryParams.createdFrom,
          createdBefore: queryParams.createdBefore,
          sortBy: queryParams.sortBy,
          order: queryParams.order,
        }),
      )
      .then(
        (result) =>
          new PaginatedBookInfoResponseDto({
            count: result.count,
            limit: result.limit,
            page: result.page,
            data: result.data.map(toBookInfoResponse),
          }),
      );
  }
}

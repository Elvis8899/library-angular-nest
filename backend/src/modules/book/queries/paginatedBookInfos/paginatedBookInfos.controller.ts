import { BookInfoPage, Sent, contractRef } from "@library/contracts";
import { AuthGuard } from "@modules/auth/guards/auth.guard";
import { BookInfo } from "@modules/book/domain/bookInfo.entity";
import { PaginatedBookInfoQueryRequestDto } from "@modules/book/dtos/bookInfoQuery.dto";
import { PaginatedBookInfosQuery } from "@modules/book/queries/paginatedBookInfos/paginatedBookInfos.query";
import { Controller, Get, HttpStatus, Query, UseGuards } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { Paginated } from "@shared/utils/database/repository.port";

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
    schema: contractRef(BookInfoPage),
  })
  async paginatedBookInfos(
    @Query() queryParams: PaginatedBookInfoQueryRequestDto,
  ): Promise<Sent<typeof BookInfoPage>> {
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
      .then(({ count, limit, page, data }) => ({ count, limit, page, data }));
  }
}

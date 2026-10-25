import {
  BookInfoPage,
  BookInfoQuery,
  contractRef,
  PageQuery,
  QueryString,
  Sent,
} from "@library/contracts";
import { ApiController } from "@modules/auth/decorators/apiController.decorator";
import { BookInfo } from "@modules/book/domain/bookInfo.entity";
import { PaginatedBookInfosQuery } from "@modules/book/queries/paginatedBookInfos/paginatedBookInfos.query";
import { Get, HttpStatus, Query } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import { Paginated } from "@shared/utils/database/repository.port";
import { ApiQueryContract } from "@shared/utils/http/apiQueryContract";

@ApiController("Livros")
export class PaginatedBookInfoController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get("bookInfos")
  @ApiOperation({ summary: "Listar Livros" })
  @ApiQueryContract(PageQuery)
  @ApiQueryContract(BookInfoQuery)
  @ApiResponse({
    status: HttpStatus.OK,
    schema: contractRef(BookInfoPage),
  })
  async paginatedBookInfos(
    // Parsed by the handler
    @Query()
    {
      page,
      limit,
      ...filters
    }: QueryString<typeof PageQuery> & QueryString<typeof BookInfoQuery>,
  ): Promise<Sent<typeof BookInfoPage>> {
    return this.queryBus
      .execute<PaginatedBookInfosQuery, Paginated<BookInfo>>(
        new PaginatedBookInfosQuery({ page, limit }, filters),
      )
      .then(({ count, limit, page, data }) => ({ count, limit, page, data }));
  }
}

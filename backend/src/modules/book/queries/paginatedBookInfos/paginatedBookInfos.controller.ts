import {
  BookInfoPage,
  BookInfoQuery,
  contractRef,
  PageQuery,
  QueryString,
  Sent,
} from "@library/contracts";
import { AuthGuard } from "@modules/auth/guards/auth.guard";
import { BookInfo } from "@modules/book/domain/bookInfo.entity";
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
import { ApiQueryContract } from "@shared/utils/http/apiQueryContract";

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

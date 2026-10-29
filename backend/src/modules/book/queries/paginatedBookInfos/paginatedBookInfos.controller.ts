import {
  BookInfoPage,
  BookInfoQuery,
  PageQuery,
  QueryString,
} from "@library/contracts";
import { ApiController } from "@modules/auth/decorators/apiController.decorator";
import { PaginatedBookInfosQuery } from "@modules/book/queries/paginatedBookInfos/paginatedBookInfos.query";
import { Get, Query } from "@nestjs/common";
import { ApiOperation } from "@nestjs/swagger";
import { QueryBus } from "@shared/utils/application/cqrs";
import { Answers } from "@shared/utils/http/answers";
import { ApiQueryContract } from "@shared/utils/http/apiQueryContract";

@ApiController("Livros")
export class PaginatedBookInfoController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get("bookInfos")
  @ApiOperation({ summary: "Listar Livros" })
  @ApiQueryContract(PageQuery)
  @ApiQueryContract(BookInfoQuery)
  @Answers(BookInfoPage)
  async paginatedBookInfos(
    // Parsed by the handler
    @Query()
    {
      page,
      limit,
      ...filters
    }: QueryString<typeof PageQuery> & QueryString<typeof BookInfoQuery>,
  ) {
    return this.queryBus
      .execute(new PaginatedBookInfosQuery({ page, limit }, filters))
      .then(({ count, limit, page, data }) => ({ count, limit, page, data }));
  }
}

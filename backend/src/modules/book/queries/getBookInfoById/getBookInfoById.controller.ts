import { BookInfo } from "@library/contracts";
import { ApiController } from "@modules/auth/decorators/apiController.decorator";
import { BookInfoNotFoundException } from "@modules/book/domain/bookInfo.errors";
import { GetBookInfoByIdQuery } from "@modules/book/queries/getBookInfoById/getBookInfoById.query";
import { Get, Param } from "@nestjs/common";
import { ApiOperation } from "@nestjs/swagger";
import { QueryBus } from "@shared/utils/application/cqrs";
import { Answers } from "@shared/utils/http/answers";
import { ApiErrors } from "@shared/utils/http/apiErrors";

@ApiController("Livros")
export class GetBookInfoByIdController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get("bookInfos/:id")
  @ApiErrors(BookInfoNotFoundException)
  @ApiOperation({ summary: "Encontrar um Livro por ID" })
  @Answers(BookInfo)
  async paginatedBookInfos(@Param("id") id: string) {
    return this.queryBus
      .execute(new GetBookInfoByIdQuery(id))
      .then((result) => result);
  }
}

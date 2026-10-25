import { BookInfo, Sent, contractRef } from "@library/contracts";
import { ApiController } from "@modules/auth/decorators/apiController.decorator";
import { BookInfoNotFoundException } from "@modules/book/domain/bookInfo.errors";
import { GetBookInfoByIdQuery } from "@modules/book/queries/getBookInfoById/getBookInfoById.query";
import { Get, HttpStatus, Param } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import { ApiErrors } from "@shared/utils/http/apiErrors";

@ApiController("Livros")
export class GetBookInfoByIdController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get("bookInfos/:id")
  @ApiErrors(BookInfoNotFoundException)
  @ApiOperation({ summary: "Encontrar um Livro por ID" })
  @ApiResponse({
    status: HttpStatus.OK,
    schema: contractRef(BookInfo),
  })
  async paginatedBookInfos(
    @Param("id") id: string,
  ): Promise<Sent<typeof BookInfo>> {
    return this.queryBus
      .execute<GetBookInfoByIdQuery, Sent<typeof BookInfo>>(
        new GetBookInfoByIdQuery(id),
      )
      .then((result) => result);
  }
}

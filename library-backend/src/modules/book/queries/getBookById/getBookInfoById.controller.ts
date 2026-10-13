import { AuthGuard } from "@auth/guards/auth.guard";
import { BookInfoDto } from "@book/dtos/bookInfo.dto";
import { GetBookInfoByIdQuery } from "@book/queries/getBookById/getBookInfoById.query";
import { Controller, Get, HttpStatus, Param, UseGuards } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

@Controller("v1/")
@ApiBearerAuth()
@UseGuards(AuthGuard)
@ApiTags("Livros")
export class GetBookInfoByIdController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get("bookInfos/:id")
  @ApiOperation({ summary: "Encontrar um Livro por ID" })
  @ApiNotFoundResponse({ description: "Livro não encontrado." })
  @ApiResponse({
    status: HttpStatus.OK,
    type: BookInfoDto,
  })
  async paginatedBookInfos(@Param("id") id: string): Promise<BookInfoDto> {
    return this.queryBus
      .execute<GetBookInfoByIdQuery, BookInfoDto>(new GetBookInfoByIdQuery(id))
      .then((result) => result);
  }
}

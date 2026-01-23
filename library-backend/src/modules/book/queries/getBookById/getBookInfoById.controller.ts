import { Controller, Get, HttpStatus, Param } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import {
  ApiOperation,
  ApiTags,
  ApiResponse,
  ApiNotFoundResponse,
} from "@nestjs/swagger";
import { BookInfoDto } from "../../dtos/bookInfo.dto";
import { GetBookInfoByIdQuery } from "./getBookInfoById.query";

@Controller("v1/")
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
      .execute<GetBookInfoByIdQuery>(new GetBookInfoByIdQuery(id))
      .then((result) => result);
  }
}

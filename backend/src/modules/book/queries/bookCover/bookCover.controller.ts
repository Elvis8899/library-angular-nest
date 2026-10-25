import { coverTypes } from "@library/contracts";
import { ApiController } from "@modules/auth/decorators/apiController.decorator";
import {
  BookCoverNotFoundException,
  BookInfoNotFoundException,
} from "@modules/book/domain/bookInfo.errors";
import { BookCoverQuery } from "@modules/book/queries/bookCover/bookCover.query";
import { Get, Header, Param, StreamableFile } from "@nestjs/common";
import { QueryBus } from "@nestjs/cqrs";
import {
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { StoredFile } from "@shared/storage/fileStorage";
import { ApiErrors } from "@shared/utils/http/apiErrors";

@ApiController("Livros")
export class BookCoverController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get("bookInfos/:id/cover")
  // Each version has its own address (coverPath's ?v=), so the browser
  // keeps it for good; private, since it took a token
  @Header("Cache-Control", "private, max-age=31536000, immutable")
  @ApiOperation({
    summary: "A capa de um Livro",
    description: "Para quem vê os livros. Leia em coverPath(livro).",
  })
  @ApiProduces(...coverTypes)
  @ApiOkResponse({ description: "A imagem." })
  @ApiErrors(BookInfoNotFoundException, BookCoverNotFoundException)
  @ApiUnprocessableEntityResponse({ description: "Id inválido." })
  async bookCover(@Param("id") id: string): Promise<StreamableFile> {
    const file = await this.queryBus.execute<BookCoverQuery, StoredFile>(
      new BookCoverQuery(id),
    );
    return new StreamableFile(file.body, {
      type: file.contentType,
      length: file.body.length,
    });
  }
}

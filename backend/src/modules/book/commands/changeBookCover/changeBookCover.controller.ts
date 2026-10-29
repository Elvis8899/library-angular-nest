import {
  BookCoverUpload,
  contractRef,
  maxCoverBytes,
} from "@library/contracts";
import { ApiController } from "@modules/auth/decorators/apiController.decorator";
import { Roles } from "@modules/auth/decorators/roles.decorator";
import { RolesGuard } from "@modules/auth/guards/roles.guard";
import { ChangeBookCover } from "@modules/book/commands/changeBookCover/changeBookCover.command";
import {
  BookCoverChangedException,
  BookCoverTooLargeException,
  BookCoverTypeException,
  BookInfoNotFoundException,
} from "@modules/book/domain/bookInfo.errors";
import { UserRoleEnum } from "@modules/user/domain/user.entity";
import { Param, Put, Request, UseGuards } from "@nestjs/common";
import {
  ApiBody,
  ApiConsumes,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { CommandBus } from "@shared/utils/application/cqrs";
import { ApiErrors } from "@shared/utils/http/apiErrors";
import { readUpload } from "@shared/utils/http/upload";
import { FastifyRequest } from "fastify";

@ApiController("Livros")
export class ChangeBookCoverController {
  constructor(private readonly commandBus: CommandBus) {}

  @Put("bookInfos/:id/cover")
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.Admin)
  @ApiOperation({
    summary: "Trocar a capa de um Livro",
    description:
      "Multipart, com a imagem; o tipo vem dos bytes, não do nome. A capa anterior é apagada.",
  })
  @ApiConsumes("multipart/form-data")
  @ApiBody({ schema: contractRef(BookCoverUpload) })
  @ApiOkResponse({ description: "Capa trocada." })
  @ApiForbiddenResponse({ description: "Só o administrador." })
  @ApiErrors(
    BookInfoNotFoundException,
    BookCoverTypeException,
    BookCoverTooLargeException,
    [BookCoverChangedException, "outra capa chegou antes"],
  )
  @ApiUnprocessableEntityResponse({
    description: "Sem arquivo ou id inválido.",
  })
  async changeBookCover(
    @Param("id") id: string,
    @Request() request: FastifyRequest,
  ): Promise<void> {
    const upload = await readUpload(request, maxCoverBytes);
    return this.commandBus.execute(new ChangeBookCover(id, upload));
  }
}

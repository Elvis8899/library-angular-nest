import { BookInfoRequest, contractRef, Created } from "@library/contracts";
import { ApiController } from "@modules/auth/decorators/apiController.decorator";
import { Roles } from "@modules/auth/decorators/roles.decorator";
import { RolesGuard } from "@modules/auth/guards/roles.guard";
import { CreateBookInfo } from "@modules/book/commands/createBookInfo/createBookInfo.command";
import { UserRoleEnum } from "@modules/user/domain/user.entity";
import { Body, HttpStatus, Post, UseGuards } from "@nestjs/common";
import {
  ApiBody,
  ApiOperation,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { CommandBus } from "@shared/utils/application/cqrs";
import { Answers } from "@shared/utils/http/answers";

@ApiController("Livros")
export class CreateBookInfoController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post("bookInfos")
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.Admin)
  @ApiOperation({
    summary: "Cria um Livro.",
    description: `Dado um Livro válido, ele será criado.`,
  })
  @Answers(Created, {
    status: HttpStatus.CREATED,
    description: "Livro criado com sucesso.",
  })
  @ApiUnprocessableEntityResponse({ description: "Livro inválido." })
  @ApiBody({ schema: contractRef(BookInfoRequest) })
  async createBookInfo(@Body() book: BookInfoRequest) {
    return this.commandBus.execute(new CreateBookInfo(book));
  }
}

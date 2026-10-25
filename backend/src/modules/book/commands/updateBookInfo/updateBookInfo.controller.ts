import { BookInfoRequest, contractRef } from "@library/contracts";
import { ApiController } from "@modules/auth/decorators/apiController.decorator";
import { Roles } from "@modules/auth/decorators/roles.decorator";
import { RolesGuard } from "@modules/auth/guards/roles.guard";
import { UpdateBookInfo } from "@modules/book/commands/updateBookInfo/updateBookInfo.command";
import { BookInfoNotFoundException } from "@modules/book/domain/bookInfo.errors";
import { UserRoleEnum } from "@modules/user/domain/user.entity";
import {
  Body,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  UseGuards,
} from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOperation,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { noop } from "@shared/utils/application/noop";
import { ApiErrors } from "@shared/utils/http/apiErrors";

@ApiController("Livros")
export class UpdateBookInfoController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Put("bookInfos/:id")
  @ApiErrors(BookInfoNotFoundException)
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.Admin)
  @HttpCode(HttpStatus.OK)
  @ApiCreatedResponse({ description: "Livro atualizado com sucesso." })
  @ApiUnprocessableEntityResponse({ description: "Livro inválido." })
  @ApiOperation({ summary: "Atualizar Livro" })
  @ApiBody({ schema: contractRef(BookInfoRequest) })
  async updateBookInfo(
    @Body() book: BookInfoRequest,
    @Param("id") id: string,
  ): Promise<void> {
    return this.commandBus.execute(new UpdateBookInfo(book, id)).then(noop);
  }
}

import { Roles } from "@modules/auth/decorators/roles.decorator";
import { AuthGuard } from "@modules/auth/guards/auth.guard";
import { AuthenticatedRequest } from "@modules/auth/guards/authenticatedRequest";
import { RolesGuard } from "@modules/auth/guards/roles.guard";
import { ReturnBookCommand } from "@modules/rental/commands/returnBook/returnBook.command";
import { UserRoleEnum } from "@modules/user/domain/user.entity";
import {
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  Request,
  UseGuards,
} from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { noop } from "@shared/utils/application/noop";

@Controller("v1/bookRentals")
@ApiTags("Empréstimos")
@ApiBearerAuth()
@UseGuards(AuthGuard)
export class ReturnBookController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Put("return/:id")
  @HttpCode(HttpStatus.OK)
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.Admin, UserRoleEnum.Client)
  @ApiCreatedResponse({ description: "Empréstimo finalizado com sucesso." })
  @ApiNotFoundResponse({ description: "Empréstimo não encontrado." })
  @ApiOperation({
    summary: "Retornar Livro",
    description:
      "Administradores podem finalizar qualquer empréstimo; clientes, apenas os próprios.",
  })
  async updateBookInfo(
    @Param("id") bookRentalId: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<void> {
    // Clients may only return their own rentals
    const ownerId =
      req.user.role === UserRoleEnum.Admin ? undefined : req.user.sub;
    return this.commandBus
      .execute(new ReturnBookCommand(bookRentalId, ownerId))
      .then(noop);
  }
}

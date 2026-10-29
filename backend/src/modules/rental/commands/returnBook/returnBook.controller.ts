import { ApiController } from "@modules/auth/decorators/apiController.decorator";
import { Roles } from "@modules/auth/decorators/roles.decorator";
import { AuthenticatedRequest } from "@modules/auth/guards/authenticatedRequest";
import { RolesGuard } from "@modules/auth/guards/roles.guard";
import { ReturnBookCommand } from "@modules/rental/commands/returnBook/returnBook.command";
import {
  BookRentalFinishedException,
  BookRentalNotFoundException,
} from "@modules/rental/domain/bookRental.errors";
import { UserRoleEnum } from "@modules/user/domain/user.entity";
import {
  HttpCode,
  HttpStatus,
  Param,
  Put,
  Request,
  UseGuards,
} from "@nestjs/common";
import { ApiCreatedResponse, ApiOperation } from "@nestjs/swagger";
import { CommandBus } from "@shared/utils/application/cqrs";
import { ApiErrors } from "@shared/utils/http/apiErrors";

@ApiController("Empréstimos")
export class ReturnBookController {
  constructor(private readonly commandBus: CommandBus) {}

  @Put("bookRentals/return/:id")
  @ApiErrors(BookRentalNotFoundException, BookRentalFinishedException)
  @HttpCode(HttpStatus.OK)
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.Admin, UserRoleEnum.Client)
  @ApiCreatedResponse({ description: "Empréstimo finalizado com sucesso." })
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
    return this.commandBus.execute(
      new ReturnBookCommand(bookRentalId, ownerId),
    );
  }
}

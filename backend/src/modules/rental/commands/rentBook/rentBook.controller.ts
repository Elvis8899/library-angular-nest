import { contractRef, RentBookRequest } from "@library/contracts";
import { ApiController } from "@modules/auth/decorators/apiController.decorator";
import { Roles } from "@modules/auth/decorators/roles.decorator";
import { AuthenticatedRequest } from "@modules/auth/guards/authenticatedRequest";
import { RolesGuard } from "@modules/auth/guards/roles.guard";
import { RentBookCommand } from "@modules/rental/commands/rentBook/rentBook.command";
import { BookRentalNotAvailableException } from "@modules/rental/domain/bookRental.errors";
import { UserRoleEnum } from "@modules/user/domain/user.entity";
import { UserNotFoundException } from "@modules/user/domain/user.errors";
import {
  Body,
  HttpCode,
  HttpStatus,
  Post,
  Request,
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

@ApiController("Empréstimos")
export class RentBookController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post("bookRentals/rent")
  @ApiErrors(UserNotFoundException, BookRentalNotAvailableException)
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.Admin, UserRoleEnum.Client)
  @ApiOperation({
    summary: "Fazer empréstimo de Livro.",
    description: `Dado um Livro válido, ele será emprestado.`,
  })
  @ApiCreatedResponse({ description: "Empréstimo criado com sucesso." })
  @ApiUnprocessableEntityResponse({ description: "Livro inválido." })
  @ApiBody({ schema: contractRef(RentBookRequest) })
  async createBookInfo(
    @Body() bookRentalInput: RentBookRequest,
    @Request() req: AuthenticatedRequest,
  ): Promise<void> {
    // A client rents for themselves
    const userId =
      req.user.role === UserRoleEnum.Admin
        ? bookRentalInput.userId
        : req.user.sub;
    return this.commandBus
      .execute<RentBookCommand>(
        new RentBookCommand({ ...bookRentalInput, userId }),
      )
      .then(noop);
  }
}

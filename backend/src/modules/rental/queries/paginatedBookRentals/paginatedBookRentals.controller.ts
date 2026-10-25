import {
  BookRentalPage,
  contractRef,
  PageQuery,
  QueryString,
  Sent,
} from "@library/contracts";
import { ApiController } from "@modules/auth/decorators/apiController.decorator";
import { AuthenticatedRequest } from "@modules/auth/guards/authenticatedRequest";
import {
  BookRentalDetails,
  RentalStatusEnum,
} from "@modules/rental/domain/bookRental.entity";
import { toBookRentalResponse } from "@modules/rental/domain/bookRentalViews";
import { PaginatedBookRentalsQuery } from "@modules/rental/queries/paginatedBookRentals/paginatedBookRentals.query";
import { UserRoleEnum } from "@modules/user/domain/user.entity";
import { Get, HttpStatus, Query, Request } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import { Paginated } from "@shared/utils/database/repository.port";
import { ApiQueryContract } from "@shared/utils/http/apiQueryContract";

@ApiController("Empréstimos")
export class PaginatedBookRentalsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get("bookRentals")
  @ApiOperation({ summary: "Listar Empréstimos de livros" })
  @ApiQueryContract(PageQuery)
  @ApiResponse({
    status: HttpStatus.OK,
    schema: contractRef(BookRentalPage),
  })
  async paginatedBookRentals(
    // Parsed by the handler
    @Query() { page, limit }: QueryString<typeof PageQuery>,
    @Request() req: AuthenticatedRequest,
  ): Promise<Sent<typeof BookRentalPage>> {
    const { user } = req;
    const userId = user.role === UserRoleEnum.Admin ? undefined : user.sub;
    const status = RentalStatusEnum.Rented;
    return this.queryBus
      .execute<PaginatedBookRentalsQuery, Paginated<BookRentalDetails>>(
        new PaginatedBookRentalsQuery({ page, limit }, status, userId),
      )
      .then((result) => ({
        count: result.count,
        limit: result.limit,
        page: result.page,
        data: result.data.map(toBookRentalResponse),
      }));
  }
}

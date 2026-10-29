import { BookRentalPage, PageQuery, QueryString } from "@library/contracts";
import { ApiController } from "@modules/auth/decorators/apiController.decorator";
import { AuthenticatedRequest } from "@modules/auth/guards/authenticatedRequest";
import { RentalStatusEnum } from "@modules/rental/domain/bookRental.entity";
import { toBookRentalResponse } from "@modules/rental/domain/bookRentalViews";
import { PaginatedBookRentalsQuery } from "@modules/rental/queries/paginatedBookRentals/paginatedBookRentals.query";
import { UserRoleEnum } from "@modules/user/domain/user.entity";
import { Get, Query, Request } from "@nestjs/common";
import { ApiOperation } from "@nestjs/swagger";
import { QueryBus } from "@shared/utils/application/cqrs";
import { Answers } from "@shared/utils/http/answers";
import { ApiQueryContract } from "@shared/utils/http/apiQueryContract";

@ApiController("Empréstimos")
export class PaginatedBookRentalsController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get("bookRentals")
  @ApiOperation({ summary: "Listar Empréstimos de livros" })
  @ApiQueryContract(PageQuery)
  @Answers(BookRentalPage)
  async paginatedBookRentals(
    // Parsed by the handler
    @Query() { page, limit }: QueryString<typeof PageQuery>,
    @Request() req: AuthenticatedRequest,
  ) {
    const { user } = req;
    const userId = user.role === UserRoleEnum.Admin ? undefined : user.sub;
    const status = RentalStatusEnum.Rented;
    return this.queryBus
      .execute(new PaginatedBookRentalsQuery({ page, limit }, status, userId))
      .then((result) => ({
        count: result.count,
        limit: result.limit,
        page: result.page,
        data: result.data.map(toBookRentalResponse),
      }));
  }
}

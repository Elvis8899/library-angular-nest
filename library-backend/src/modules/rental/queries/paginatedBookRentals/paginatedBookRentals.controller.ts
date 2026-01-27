import {
  Controller,
  Get,
  HttpStatus,
  Query,
  Request,
  UseGuards,
} from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import {
  ApiOperation,
  ApiTags,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { PaginatedBookRentalResponseDto } from "../../dtos/bookRental.dto";
import { PaginatedQueryRequestDto } from "@src/shared/api/paginated-query.request.dto";
import { PaginatedBookRentalsQuery } from "./paginatedBookRentals.query";
import { RentalStatusEnum } from "../../domain/bookRental.entity";
import { AuthenticatedRequest } from "@src/modules/auth/domain/login.entity";
import { UserRoleEnum } from "@src/modules/user/domain/user.entity";
import { AuthGuard } from "@src/modules/auth/guards/auth.guard";

@Controller("v1/bookRentals")
@ApiBearerAuth()
@UseGuards(AuthGuard)
@ApiTags("Empréstimos")
export class PaginatedBookRentalsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get("")
  @ApiOperation({ summary: "Listar Empréstimos de livros" })
  @ApiResponse({
    status: HttpStatus.OK,
    type: PaginatedBookRentalResponseDto,
  })
  async paginatedBookRentals(
    @Query() queryParams: PaginatedQueryRequestDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<PaginatedBookRentalResponseDto> {
    const { user } = req;
    const userId = user?.role === UserRoleEnum.Admin ? undefined : user?.sub;
    const status = RentalStatusEnum.Rented;
    return this.queryBus
      .execute<PaginatedBookRentalsQuery>(
        new PaginatedBookRentalsQuery(queryParams, status, userId),
      )
      .then((result) => new PaginatedBookRentalResponseDto(result));
  }
}

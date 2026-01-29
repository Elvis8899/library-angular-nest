import { IQuery, IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { BookRentalRepository } from "@rental/database/bookRental.repository.port";
import {
  BookRentalDetails,
  RentalStatusEnum,
} from "@rental/domain/bookRental.entity";
import { executeTask } from "@shared/utils/application/executeTask";
import { fromInputRE } from "@shared/utils/application/fromInput";
import { Apply, FPF, RE, RTE } from "@shared/utils/application/monads";
import { performRTE } from "@shared/utils/application/perform";
import { Paginated } from "@shared/utils/database/repository.port";
import {
  PaginatedQueryPagination,
  PaginatedQueryValidator,
  PaginatedReturnValidator,
} from "@shared/utils/domain/query.base";
import { UUID } from "@shared/uuid/entities/uuid";
import { PinoLogger } from "nestjs-pino";
import { z } from "zod";

export class PaginatedBookRentalsQuery implements IQuery {
  constructor(
    public readonly params: PaginatedQueryPagination,
    public readonly status: RentalStatusEnum | undefined,
    public readonly userId: string | undefined,
  ) {}
}

@QueryHandler(PaginatedBookRentalsQuery)
export class PaginatedBookRentalsQueryHandler implements IQueryHandler<
  PaginatedBookRentalsQuery,
  Paginated<BookRentalDetails>
> {
  constructor(
    private readonly userRepository: BookRentalRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext("PaginatedBookRentals");
  }

  /**
   * In read model we don't need to execute
   * any business logic, so we can bypass
   * domain and repository layers completely
   * and execute query directly
   */
  async execute(
    query: PaginatedBookRentalsQuery,
  ): Promise<Paginated<BookRentalDetails>> {
    const task = FPF.pipe(
      query.params,
      fromInputRE(PaginatedQueryValidator, "PaginatedBookRentalsQuery"),
      RE.bind("query", () =>
        Apply.sequenceS(RE.Applicative)({
          status: fromInputRE(
            z.enum(RentalStatusEnum).optional(),
            "status",
          )(query.status),
          userId: fromInputRE(UUID.optional(), "uuid")(query.userId),
        }),
      ),
      RTE.fromReaderEither,
      RTE.chain(
        performRTE(
          this.userRepository.findAllPaginated,
          "get user list in storage system.",
        ),
      ),
      RTE.chainReaderEitherKW(
        fromInputRE(
          PaginatedReturnValidator(BookRentalDetails),
          "BookRentalDetails",
        ),
      ),
    )({ logger: this.logger });
    return executeTask(task);
  }
}

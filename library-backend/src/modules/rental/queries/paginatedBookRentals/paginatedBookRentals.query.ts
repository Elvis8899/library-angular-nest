import { PinoLogger } from "nestjs-pino";
import { IQuery, IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { Paginated } from "@shared/ddd";
import {
  PaginatedQueryPagination,
  PaginatedQueryValidator,
  PaginatedReturnValidator,
} from "@shared/ddd/query.base";
import { executeTask } from "@shared/utils/executeTask";
import { performRTE } from "@shared/utils/perform";
import { Apply, FPF, RE, RTE } from "@shared/functional/monads";
import { fromInputRE } from "@src/shared/utils/fromInput";
import {
  BookRentalDetails,
  RentalStatusEnum,
} from "../../domain/bookRental.entity";
import { BookRentalRepository } from "../../database/bookRental.repository.port";
import { UUID } from "@src/shared/uuid/entities/uuid";
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

import { PageQuery, QueryString } from "@library/contracts";
import { BookRentalRepository } from "@modules/rental/database/bookRental.repository.port";
import {
  BookRentalDetails,
  rentalDetailsOf,
  RentalStatusEnum,
} from "@modules/rental/domain/bookRental.entity";
import { Clock } from "@shared/clock/clock";
import { Query, QueryHandler } from "@shared/utils/application/cqrs";
import { inputsRTE } from "@shared/utils/application/fromInput";
import { FPF, RTE } from "@shared/utils/application/monads";
import { perform } from "@shared/utils/application/perform";
import { UseCaseHandler } from "@shared/utils/application/useCase";
import { Paginated } from "@shared/utils/database/repository.port";
import {
  PageRequest,
  PageRequestSchema,
} from "@shared/utils/domain/query.base";
import { UUID } from "@shared/uuid/uuid";
import { z } from "zod";

export class PaginatedBookRentalsQuery extends Query<
  Paginated<BookRentalDetails>
> {
  constructor(
    // The query string's, or numbers from a caller in the code
    public readonly params: PageRequest | QueryString<typeof PageQuery>,
    public readonly status: RentalStatusEnum | undefined,
    public readonly userId: string | undefined,
  ) {
    super();
  }
}

@QueryHandler(PaginatedBookRentalsQuery)
export class PaginatedBookRentalsQueryHandler extends UseCaseHandler<PaginatedBookRentalsQuery> {
  constructor(
    private readonly clock: Clock,
    private readonly userRepository: BookRentalRepository,
  ) {
    super();
  }

  /**
   * In read model we don't need to execute
   * any business logic, so we can bypass
   * domain and repository layers completely
   * and execute query directly
   */
  protected pipeline(query: PaginatedBookRentalsQuery) {
    return FPF.pipe(
      inputsRTE({
        window: [PageRequestSchema, "PaginatedBookRentalsQuery", query.params],
        status: [z.enum(RentalStatusEnum).optional(), "status", query.status],
        userId: [UUID.optional(), "uuid", query.userId],
      }),
      RTE.map(({ window, ...filters }) => ({ ...window, query: filters })),
      RTE.chain(perform(this.userRepository).findAllPaginated),
      RTE.map((page) => ({
        ...page,
        data: page.data.map(rentalDetailsOf(this.clock.now())),
      })),
    );
  }
}

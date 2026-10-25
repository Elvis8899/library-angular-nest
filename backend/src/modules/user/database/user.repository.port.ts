import { User } from "@modules/user/domain/user.entity";
import { O, TE } from "@shared/utils/application/monads";
import {
  Paginated,
  RepositoryDefaultPort,
} from "@shared/utils/database/repository.port";
import { PaginatedQueryParams } from "@shared/utils/domain/query.base";

export abstract class UserRepository implements RepositoryDefaultPort<User> {
  findById!: (id: string) => TE.TaskEither<Error, O.Option<User>>;
  /** The users with these ids; missing ones are left out. */
  findByIds!: (ids: readonly string[]) => TE.TaskEither<Error, User[]>;
  findByEmail!: (email: string) => TE.TaskEither<Error, O.Option<User>>;
  findByCPF!: (cpf: string) => TE.TaskEither<Error, O.Option<User>>;
  findAll!: () => TE.TaskEither<Error, User[]>;
  findAllPaginated!: (
    params: PaginatedQueryParams,
  ) => TE.TaskEither<Error, Paginated<User>>;
  /** Atomically deletes the user, whose rentals cascade. Fails with
   * UserHasActiveRentalsException (lending example) if a rental is unfinished, since deleting
   * it would leave its book item rented, and UserNotFoundException if the
   * user doesn't exist. */
  deleteById!: (id: string) => TE.TaskEither<Error, void>;
  save!: (user: User) => TE.TaskEither<Error, void>;
  /** Revokes every refresh token issued to the user. */
  incrementTokenVersion!: (userId: string) => TE.TaskEither<Error, void>;
}

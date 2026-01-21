import { O, TE } from "@shared/functional/monads";
import { PaginatedQueryParams } from "@shared/ddd/query.base";

/*  Most of repositories will probably need generic
    save/find/delete operations, so it's easier
    to have some shared interfaces.
    More specific queries should be defined
    in a respective repository.
*/

export class Paginated<T> {
  readonly count: number;
  readonly limit: number;
  readonly page: number;
  readonly data: readonly T[];

  constructor(props: Paginated<T>) {
    this.count = props.count;
    this.limit = props.limit;
    this.page = props.page;
    this.data = props.data;
  }
}

export interface RepositoryPort<Entity> {
  findAll(): TE.TaskEither<Error, Entity[]>;
  findOneById(id: string): TE.TaskEither<Error, O.Option<Entity>>;
  findAllPaginated(
    params: PaginatedQueryParams,
  ): TE.TaskEither<Error, Paginated<Entity>>;
  //
  save(entity: Entity): TE.TaskEither<Error, void>;
  deleteById(entity: string): TE.TaskEither<Error, void>;
}

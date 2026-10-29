import { Type } from "@nestjs/common";
import {
  Command as NestCommand,
  CommandHandler as NestCommandHandler,
  Query as NestQuery,
  QueryHandler as NestQueryHandler,
} from "@nestjs/cqrs";

// The CQRS building blocks, the only file that imports @nestjs/cqrs. A
// command or query names what it answers, so `commandBus.execute(new
// CreateUser(…))` is typed by it, and the decorators check that its handler
// answers that.
export { CommandBus, CqrsModule, QueryBus } from "@nestjs/cqrs";

/** A write; `R` is what it answers (nothing by default). */
export abstract class Command<R = void> extends NestCommand<R> {}

/** A read answering `R`. */
export abstract class Query<R> extends NestQuery<R> {}

/** What a command or query answers. */
export type ResultOf<M> =
  M extends NestCommand<infer R> ? R : M extends NestQuery<infer R> ? R : never;

/** A command's or query's handler: `implements Handles<CreateUser>`. */
export interface Handles<M extends Command<unknown> | Query<unknown>> {
  execute(message: M): Promise<ResultOf<M>>;
}

/** What UseCase knows of the handler it runs for. */
export interface UseCaseOf {
  // What its runs are logged, timed and audited under: the command's class
  // name, or the query's without "Query" (WoodBatchQuery runs as WoodBatch)
  name: string;
  // Commands are audited, queries aren't
  command: boolean;
}

// The handlers' classes, marked by the decorators
const useCases = new WeakMap<object, UseCaseOf>();

/** Registers the class as the command's handler on the CommandBus. */
export const CommandHandler =
  <C extends Command<unknown>>(command: Type<C>) =>
  (target: Type<Handles<C>>): void => {
    NestCommandHandler(command)(target);
    useCases.set(target, { name: command.name, command: true });
  };

/** Registers the class as the query's handler on the QueryBus. */
export const QueryHandler =
  <Q extends Query<unknown>>(query: Type<Q>) =>
  (target: Type<Handles<Q>>): void => {
    NestQueryHandler(query)(target);
    useCases.set(target, {
      name: query.name.replace(/Query$/, ""),
      command: false,
    });
  };

/** The use case the object handles, if it's a handler's instance. */
export const useCaseOf = (handler: object): UseCaseOf | undefined =>
  useCases.get(handler.constructor);

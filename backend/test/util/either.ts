import { E } from "@shared/utils/application/monads";

/** A rule's refusal, or undefined when it accepted. */
export const leftOf = <A>(either: E.Either<Error, A>): Error | undefined =>
  E.isLeft(either) ? either.left : undefined;

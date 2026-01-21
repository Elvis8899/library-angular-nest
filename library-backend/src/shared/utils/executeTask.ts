import { E, TE } from "@shared/functional/monads";

/**
 * Given a taskEither, execute the task, await the result and return a promise.
 * It is used a lot as nest rely pretty heavily on Promise
 *
 * @param task: a TaskEither
 */
export const executeTask = <E, A>(task: TE.TaskEither<E, A>): Promise<A> =>
  new Promise(async (resolve, reject) => {
    const result = await task();
    return E.fold(reject, resolve)(result);
  });

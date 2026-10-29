import { E, FPF, TE } from "@shared/utils/application/monads";

/**
 * Given a taskEither, execute the task, await the result and return a promise.
 * It is used a lot as nest rely pretty heavily on Promise
 *
 * @param task: a TaskEither
 */
export const executeTask = <E, A>(task: TE.TaskEither<E, A>): Promise<A> =>
  new Promise((resolve, reject) => {
    (async () => {
      const result = await task();
      E.fold(reject, resolve)(result);
    })().catch(reject);
  });

/**
 * Several tasks at once, their values in order; the first to fail rejects:
 * `const [stock, lines] = await executeTasks(findStock(id), findLines(id))`.
 */
export const executeTasks = <
  T extends readonly TE.TaskEither<unknown, unknown>[],
>(
  ...tasks: T
): Promise<{
  -readonly [K in keyof T]: T[K] extends TE.TaskEither<unknown, infer A>
    ? A
    : never;
}> => FPF.unsafeCoerce(Promise.all(tasks.map((task) => executeTask(task))));

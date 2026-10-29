# Handler pipelines: fp-ts in one page

Every command and query handler is a single fp-ts pipeline. This page is what you need to read and write one. The reference for each helper is its doc comment in `backend/src/modules/shared/utils/application/`.

## The four types

| Type | Is | Built with |
|---|---|---|
| `O.Option<A>` | a value or nothing (`O.some(a)`, `O.none`) | repositories' `find…ById` answer one |
| `E.Either<Error, A>` | a value or an error (`E.right(a)`, `E.left(err)`) | pure rules that can refuse return one |
| `TE.TaskEither<Error, A>` | a lazy async `Either` (`() => Promise<Either>`) | every port method (repository, storage) returns one |
| `RTE.ReaderTaskEither<Env, Error, A>` | a `TaskEither` that also needs an environment | the pipeline itself |

The environment is `UseCaseEnv`: `{ logger, events }`. `UseCase.run` supplies it, so a handler never passes it by hand. Import every fp-ts name from `@shared/utils/application/monads` (`RTE`, `TE`, `O`, `E`, `A`, `FPF`), never from `fp-ts/*`.

## A pipeline, read top to bottom

`FPF.pipe(first, step, step, …)` hands each step's result to the next. While a step succeeds the value flows on; the first step that fails (a `Left`) skips the rest and becomes the handler's error, which `DomainErrorFilter` turns into the HTTP answer. So a handler reads as the happy path, and each refusal is the line that can fail.

Most pipelines carry a **scope**, an object of named values that grows step by step. This is `createUser`:

```ts
protected pipeline(command: CreateUser) {
  return FPF.pipe(
    // 1. Parse the inputs: { id, input }, or a 422 on the first that fails
    inputsRTE({
      id: [UUID, "uuid", this.uuidGeneratorService.generateUUID()],
      input: [NewUserInput, "User", command.props],
    }),

    // 2. Two checks that don't need each other, at once; the scope stays
    RTE.tap(({ input }) =>
      allRTE({
        cpf: orConflict(perform(this.userRepository).findByCPF(input.cpf), userCPFAlreadyExistsException),
        email: orConflict(perform(this.userRepository).findByEmail(input.email), userEmailAlreadyExistsException),
      }),
    ),

    // 3. Add a value to the scope: { id, input, password }
    RTE.bind("password", ({ input }) => RTE.fromTask(() => this.passwordHasher.hash(input.password))),

    // 4. Apply the pure rule: the value is now the new user, no longer the scope
    RTE.map(({ id, input, password }) => registerUser(id, input, password, this.clock.now())),

    // 5. Store it, announce it, tell the screens, answer nothing
    RTE.tap(perform(this.userRepository).save),
    RTE.tap(publishRTE(userCreated)),
    RTE.tap((user) => changedRTE({ resource: Resource.Users, key: user.id })),
    RTE.asUnit,
  );
}
```

A lookup that must find something reads `RTE.bind("book", ({ id }) => orFail(perform(this.bookInfoRepository).findById(id), bookInfoNotFoundException))`; two that don't need each other, `bindAll(({ rental }) => ({ user: …, bookItem: … }))` (`rentBook`).

## The operators you'll use

| Operator | Use it to | Value after |
|---|---|---|
| `RTE.bind("name", (scope) => rte)` | look something up and keep it | scope + `name` |
| `RTE.bindTo("name")` | start a scope from a plain value | `{ name }` |
| `RTE.let("name", (scope) => value)` | add a computed value (no I/O) | scope + `name` |
| `RTE.tap((v) => rte)` | run a check or a write and keep the value | unchanged |
| `RTE.map((v) => w)` | transform with a pure function | `w` |
| `RTE.chain((v) => rte)` | continue with a step that needs the value | the step's value |
| `RTE.chainEitherK(rule)` | apply a pure rule that can refuse (`Either`) | the rule's value |
| `RTE.fromEither(e)` | lift a rule's `Either` inside `tap`/`bind` | — |
| `RTE.filterOrElseW(pred, err)` | fail unless a condition holds | unchanged |
| `RTE.asUnit` | answer `void` | `undefined` |

The `W` variants (`chainW`, `bindW`) accept a step whose error or environment type differs from the pipeline's. Use them only when TypeScript asks for them.

## The project's helpers

| Helper | Does |
|---|---|
| `inputsRTE({ a: [Schema, "name", raw], … })` / `inputRTE(Schema, "name", raw)` | Opens a handler: parses with Zod and fails with 422 on the first input that doesn't parse. |
| `perform(port).method(args)` | Runs a port's method as a step, logged as `UserRepository.findById failed` or `succeeded`. |
| `orFail(step, notFound)` | Turns an empty `Option` into an error. The usual "must exist". |
| `orConflict(step, conflict, isConflict?)` | Turns a found `Option` into an error: uniqueness checks. The predicate lets an update skip its own row. |
| `allRTE({ a: step, b: step })` | Runs steps at once and gives their values by name. If several fail, the first key wins. |
| `bindAll((scope) => ({ a: step, b: step }))` | `allRTE`, bound into the scope like `RTE.bind`. Refuses (in its types) to rebind a name the scope already has. |
| `publishRTE(eventFactory)` | Publishes the event the factory builds from the value. |
| `changedRTE({ resource, key? }, …)` / `nothingChangedRTE` | Tells the screens what changed. Every write command ends with one. |
| `this.recordingBy(requesterId)` | Who and when, for rules that stamp new rows (`UseCaseHandler` holds the clock and UUIDs). |

## Where things go

- **Rules are pure functions next to the entity** (`registerUser`, `changeUserDetails`). They take plain values and return the new value or an `Either`. No repositories, no `Date.now()` (take the time as an argument: `this.clock.now()`, or `this.recordingBy(userId)` for rules that stamp new rows).
- **The handler only looks up, applies rules and stores.** If you're writing an `if` with business meaning inside the pipeline, it probably belongs in a rule.
- **Order is meaning.** The first failing step is the answer, so put access checks first and a check that guards a write right before it. Lookups that don't depend on each other go in one `bindAll`/`allRTE`, access check first.
- **A rule concurrent requests could break** is also enforced by the repository's conditional write (`ensureWritten`, `*.changed`) or a check constraint.

## When TypeScript complains

- **The whole `pipe(...)` is `unknown`, or "not assignable to `UseCaseHandler`"**: inference broke at one step and everything after it lost its type. Look for the *first* error in the pipe, not the last.
- **"Property 'events' is missing"**: a step needs `UseCaseEnv`, but something earlier fixed the environment to `{ logger }`. Give the step's environment explicitly (`perform(repo).findById<UseCaseEnv>(id)`), or use the `W` variant.
- **A branch's types don't line up** (`RTE.right(null)` against a lookup): annotate the branch, e.g. `RTE.right<UseCaseEnv, Error, Item | null>(null)`.
- **`bindAll would rebind x`**: a lookup's name is already in the scope. Rename it.

## Testing a handler

Unit specs build the handler with fakes and run it like the controller would:

```ts
const ctx = useHandlerModule({ providers: [CreateUserHandler] }, (get) => ({
  handler: get(CreateUserHandler),
  users: get(UserRepository),
}));

await expect(ctx.handler.execute(new CreateUser(user)))
  .resolves.toEqual(undefined);                                       // created
await expect(ctx.handler.execute(new CreateUser(taken)))
  .rejects.toBeInstanceOf(UserEmailAlreadyExistsException);           // refused
```

`execute` rejects with the pipeline's error. Rules tested on their own return `Either`: check them with `leftOf(result)` (`test/util/either.ts`).

## Logs

Each run logs its input (`logged(command)` narrows it; never log passwords or tokens), then one line per `perform` step, under the use case's name (the command's class, or the query's without `Query`), and is timed in `Metrics`. When a request fails, the last `… failed` line names the port and method that failed.

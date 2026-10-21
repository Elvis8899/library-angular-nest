import { E, FPF } from "@shared/utils/application/monads";
import { prismaTasks } from "@shared/utils/database/prismaTasks";
import { UnknownException } from "@shared/utils/domain/shared.errors";

// Stands in for a Prisma delegate: its methods read `this`, as Prisma's do
class FakeDelegate {
  rows = [{ id: "1" }];
  name = "user";

  findMany(args: { take: number }): Promise<{ id: string }[]> {
    return Promise.resolve(this.rows.slice(0, args.take));
  }

  count(): Promise<number> {
    return Promise.reject(new Error("connection lost"));
  }
}

describe("[Unit] prismaTasks", () => {
  const delegate = new FakeDelegate();
  const tasks = prismaTasks(() => delegate);

  it("Should run a method on the delegate and return its result", async () => {
    const result = await tasks.findMany({ take: 1 })();

    expect(result).toEqual(E.right([{ id: "1" }]));
  });

  it("Should turn a rejection into a 500", async () => {
    const result = await tasks.count()();

    expect(E.isLeft(result)).toBe(true);
    expect(E.isLeft(result) && result.left).toBeInstanceOf(UnknownException);
  });

  it("Should read the delegate only when a method is used", () => {
    const delegateGetter = vi.fn(() => delegate);

    const lazyTasks = prismaTasks(delegateGetter);
    expect(delegateGetter).not.toHaveBeenCalled();

    void lazyTasks.findMany({ take: 1 });
    expect(delegateGetter).toHaveBeenCalledTimes(1);
  });

  it.each([["then"], ["name"], ["missing"]])(
    "Should leave %s undefined, since it isn't a method",
    (key) => {
      // Keys the type doesn't declare, read anyway
      const untyped: Record<string, unknown> = FPF.unsafeCoerce(tasks);
      expect(untyped[key]).toBeUndefined();
    },
  );
});

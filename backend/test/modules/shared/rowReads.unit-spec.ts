import { executeTask } from "@shared/utils/application/executeTask";
import { O } from "@shared/utils/application/monads";
import { validateFromUnknown } from "@shared/utils/application/validateWith";
import { rowReads } from "@shared/utils/database/rowReads";
import { z } from "zod";

const Row = z.object({ id: z.string() });

// Stands in for a Prisma delegate, recording the queries it gets
const delegateOf = (rows: unknown[]) => ({
  findUnique: vi.fn(() => Promise.resolve(rows[0] ?? null)),
  findFirst: vi.fn(() => Promise.resolve(rows[0] ?? null)),
  findMany: vi.fn(() => Promise.resolve(rows)),
  count: vi.fn(() => Promise.resolve(rows.length)),
});

const page = { page: 0, limit: 10, offset: 20 };

describe("[Unit] rowReads", () => {
  it("Should read by id, ids, all and page, with the include and order", async () => {
    const delegate = delegateOf([{ id: "1" }]);
    const reads = rowReads(() => delegate, validateFromUnknown(Row, "Row"), {
      include: { lines: true },
      orderBy: { name: "asc" },
    });

    expect(await executeTask(reads.findById("1"))).toEqual(O.some({ id: "1" }));
    expect(delegate.findUnique).toHaveBeenCalledWith({
      where: { id: "1" },
      include: { lines: true },
    });
    await executeTask(reads.findByIds(["1"]));
    expect(delegate.findMany).toHaveBeenLastCalledWith({
      where: { id: { in: ["1"] } },
      include: { lines: true },
      orderBy: { name: "asc" },
    });
    expect(await executeTask(reads.findAll())).toEqual([{ id: "1" }]);
    expect(await executeTask(reads.findPage(page, { active: true }))).toEqual({
      data: [{ id: "1" }],
      count: 1,
      page: 0,
      limit: 10,
    });
    expect(delegate.findMany).toHaveBeenLastCalledWith({
      where: { active: true },
      skip: 20,
      take: 10,
      include: { lines: true },
      orderBy: { name: "asc" },
    });
    expect(delegate.count).toHaveBeenCalledWith({ where: { active: true } });
  });

  it("Should filter with findWhere and findFirstWhere", async () => {
    const delegate = delegateOf([{ id: "1" }]);
    const reads = rowReads(() => delegate, validateFromUnknown(Row, "Row"), {
      orderBy: { name: "asc" },
    });

    expect(await executeTask(reads.findWhere({ active: true }))).toEqual([
      { id: "1" },
    ]);
    expect(delegate.findMany).toHaveBeenLastCalledWith({
      where: { active: true },
      orderBy: { name: "asc" },
    });
    expect(
      await executeTask(reads.findWhere({ active: true }, { id: "desc" })),
    ).toEqual([{ id: "1" }]);
    expect(delegate.findMany).toHaveBeenLastCalledWith({
      where: { active: true },
      orderBy: { id: "desc" },
    });
    expect(await executeTask(reads.findFirstWhere({ id: "1" }))).toEqual(
      O.some({ id: "1" }),
    );
  });

  it("Should leave out what isn't given, and refuse rows that don't match", async () => {
    const delegate = delegateOf([]);
    const reads = rowReads(() => delegate, validateFromUnknown(Row, "Row"));

    expect(await executeTask(reads.findById("1"))).toEqual(O.none);
    await executeTask(reads.findPage(page));
    expect(delegate.findMany).toHaveBeenLastCalledWith({
      where: {},
      skip: 20,
      take: 10,
    });

    const wrong = rowReads(
      () => delegateOf([{ id: 1 }]),
      validateFromUnknown(Row, "Row"),
    );
    await expect(executeTask(wrong.findAll())).rejects.toThrow();
  });
});

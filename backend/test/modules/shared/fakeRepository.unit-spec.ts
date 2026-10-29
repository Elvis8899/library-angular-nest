import {
  executeTask,
  executeTasks,
} from "@shared/utils/application/executeTask";
import { Ord, S } from "@shared/utils/application/monads";
import { validateFromUnknown } from "@shared/utils/application/validateWith";
import { FakeRepository } from "@shared/utils/database/fakeRepository.base";
import { z } from "zod";

// The base every module's fake extends, checked on its own so the core keeps
// full coverage without the modules that use each feature

const Row = z.object({ id: z.string(), name: z.string() });
type Row = z.infer<typeof Row>;

class FakeRowRepository extends FakeRepository<Row> {
  protected readonly validate = validateFromUnknown(Row, "Row");

  byName = this.pageOf(
    () => true,
    Ord.contramap((row: Row) => row.name)(S.Ord),
  );
}

describe("[Unit] FakeRepository", () => {
  let rows: FakeRowRepository;

  beforeEach(async () => {
    rows = new FakeRowRepository();
    await executeTasks(
      rows.save({ id: "1", name: "b" }),
      rows.save({ id: "2", name: "a" }),
    );
  });

  it("Should page the rows in insertion order", async () => {
    const page = await executeTask(
      rows.findAllPaginated({ page: 0, limit: 1, offset: 0 }),
    );

    expect(page).toEqual({
      data: [{ id: "1", name: "b" }],
      count: 2,
      page: 0,
      limit: 1,
    });
  });

  it("Should page the rows sorted by the given order", async () => {
    const page = await executeTask(
      rows.byName({ page: 0, limit: 10, offset: 0 }),
    );

    expect(page.data.map((row) => row.name)).toEqual(["a", "b"]);
  });

  it("Should merge a partial save into the stored row", async () => {
    await executeTask(rows.save({ id: "1", name: "c" }));

    expect(await executeTask(rows.findAll())).toEqual([
      { id: "1", name: "c" },
      { id: "2", name: "a" },
    ]);
  });
});

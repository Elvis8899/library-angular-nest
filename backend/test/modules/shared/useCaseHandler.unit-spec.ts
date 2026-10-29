import { Query, QueryHandler } from "@shared/utils/application/cqrs";
import { inputRTE } from "@shared/utils/application/fromInput";
import { FPF, RTE } from "@shared/utils/application/monads";
import { Recording } from "@shared/utils/application/recording";
import { UseCaseHandler } from "@shared/utils/application/useCase";
import { UUID } from "@shared/uuid/uuid";
import { useHandlerModule } from "@test/util/handlerModule";

// A handler that stamps what it would record, from a lone input
class StampQuery extends Query<Recording> {
  constructor(public readonly userId: string) {
    super();
  }
}

@QueryHandler(StampQuery)
class StampQueryHandler extends UseCaseHandler<StampQuery> {
  protected pipeline(query: StampQuery) {
    return FPF.pipe(
      inputRTE(UUID, "userId", query.userId),
      RTE.map((userId) => this.recordingBy(userId)),
    );
  }
}

describe("[Unit] UseCaseHandler", () => {
  const ctx = useHandlerModule({ providers: [StampQueryHandler] }, (get) => ({
    handler: get(StampQueryHandler),
  }));
  const userId = "00000000-0000-4000-8000-000000000001";

  it("Should give a recording by the user, from the clock read once", async () => {
    const recording = await ctx.handler.execute(new StampQuery(userId));

    expect(recording).toMatchObject({
      recordedById: userId,
      today: "2026-10-21",
      now: new Date("2026-10-21T12:00:00Z"),
    });
    expect(recording.newId()).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("Should refuse a lone input that doesn't parse, naming it", async () => {
    await expect(ctx.handler.execute(new StampQuery("nope"))).rejects.toThrow(
      /userId/,
    );
  });
});

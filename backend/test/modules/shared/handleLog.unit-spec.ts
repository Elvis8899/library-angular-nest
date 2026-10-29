import {
  loggerOnLeftR,
  loggerOnRightR,
  summaryOf,
} from "@shared/utils/application/handleLog";
import { FPF, O } from "@shared/utils/application/monads";
import { unknownException } from "@shared/utils/domain/shared.errors";
import { PinoLogger } from "nestjs-pino";

describe("[Unit] loggerOnLeftR", () => {
  const logger = { warn: vi.fn(), error: vi.fn() };
  const log = (error: Error) =>
    loggerOnLeftR("save user")(error)({
      logger: FPF.unsafeCoerce<typeof logger, PinoLogger>(logger),
    });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Should log the error", () => {
    log(new Error("invalid input"));

    expect(logger.warn).toHaveBeenCalledWith("Error - save user");
    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining("invalid input"),
    );
  });

  it("Should also log the cause a 500 hides from the client", () => {
    log(unknownException(new Error("connection lost")));

    expect(logger.error).toHaveBeenCalledTimes(2);
    expect(logger.error).toHaveBeenLastCalledWith(
      expect.stringContaining("Caused by - connection lost"),
    );
  });
});

describe("[Unit] loggerOnRightR", () => {
  it("Should log the message with a summary of the value, at debug level", () => {
    const logger = { debug: vi.fn() };
    const rows = Array.from({ length: 3200 }, (_, i) => ({
      id: `r${String(i)}`,
    }));

    expect(
      loggerOnRightR("Rows read")(rows)({
        logger: FPF.unsafeCoerce<typeof logger, PinoLogger>(logger),
      }),
    ).toBe(rows);
    expect(logger.debug).toHaveBeenCalledTimes(1);
    expect(logger.debug).toHaveBeenCalledWith(
      { value: { count: 3200 } },
      "Rows read",
    );
  });
});

describe("[Unit] summaryOf", () => {
  it.each([
    ["a list, its length", [1, 2, 3], { count: 3 }],
    ["a record, its id", { id: "w1", name: "Ana" }, { id: "w1" }],
    [
      "a record without id, its fields",
      { added: [], skipped: 2 },
      { fields: ["added", "skipped"] },
    ],
    ["an empty Option", O.none, "none"],
    [
      "a full Option, what it holds",
      O.some({ id: "w1" }),
      { some: { id: "w1" } },
    ],
    ["a number, itself", 3, 3],
    ["nothing, itself", undefined, undefined],
    ["null, itself", null, null],
  ])("Should summarize %s", (_case, value, summary) => {
    expect(summaryOf(value)).toEqual(summary);
  });
});

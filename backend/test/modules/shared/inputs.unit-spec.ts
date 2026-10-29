import { inputsRTE } from "@shared/utils/application/fromInput";
import { E, FPF } from "@shared/utils/application/monads";
import { leftOf } from "@test/util/either";
import { PinoLogger } from "nestjs-pino";
import { z } from "zod";

describe("[Unit] inputsRTE", () => {
  const logger = {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
  const env = { logger: FPF.unsafeCoerce<typeof logger, PinoLogger>(logger) };
  const Id = z.uuid();
  const Qty = z.coerce.number().positive();

  it("Should parse every input into its name", async () => {
    const id = "00000000-0000-4000-8000-000000000001";

    const result = await inputsRTE({
      id: [Id, "id", id],
      qty: [Qty, "qty", "2.5"],
    })(env)();

    expect(result).toEqual(E.right({ id, qty: 2.5 }));
  });

  it("Should fail with the first input that doesn't parse, in order", async () => {
    const result = await inputsRTE({
      qty: [Qty, "qty", "-1"],
      id: [Id, "id", "nope"],
    })(env)();

    expect(leftOf(result)?.message).toContain("qty");
  });
});

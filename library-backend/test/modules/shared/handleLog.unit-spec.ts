import { loggerOnLeftR } from "@shared/utils/application/handleLog";
import { FPF } from "@shared/utils/application/monads";
import { unknownException } from "@shared/utils/domain/shared.erros";
import { PinoLogger } from "nestjs-pino";

describe("[Unit] loggerOnLeftR", () => {
  const logger = { warn: jest.fn(), error: jest.fn() };
  const log = (error: Error) =>
    loggerOnLeftR("save user")(error)({
      logger: FPF.unsafeCoerce<typeof logger, PinoLogger>(logger),
    });

  beforeEach(() => {
    jest.clearAllMocks();
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

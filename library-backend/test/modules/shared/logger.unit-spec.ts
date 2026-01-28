import { Test } from "@nestjs/testing";
import { FPF } from "@shared/functional/monads";
import { FakeLoggerService } from "@shared/logger/adapters/fake/FakeLogger.service";
import { getGenReqId } from "@src/shared/logger/logger.module";
import { PinoLogger } from "nestjs-pino";

// let logger: PinoLogger;

beforeAll(async () => {
  // const moduleRef =
  await Test.createTestingModule({
    providers: [{ provide: PinoLogger, useClass: FakeLoggerService }],
  }).compile();

  // logger = moduleRef.get<PinoLogger>(PinoLogger);
});

describe("[Unit] Logger", () => {
  it("Logger should return uuid if requestId is missing in request", () => {
    // When getting req id
    const res = getGenReqId(FPF.unsafeCoerce({}), FPF.unsafeCoerce({}));

    expect(res).toBeTruthy();
  });
});

import { Test } from "@nestjs/testing";
import { FPF } from "@shared/functional/monads";
import { FakeLoggerService } from "@shared/logger/adapters/fake/FakeLogger.service";
import {
  getGenReqId,
  getLoggerOptions,
} from "@src/modules/shared/logger/logger.config";
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

  it("Logger should return uuid if requestId is not missing in request", () => {
    const uuid = "test";
    // When getting req id
    const res = getGenReqId(
      FPF.unsafeCoerce({ requestId: uuid }),
      FPF.unsafeCoerce({}),
    );

    expect(res).toBe(uuid);
  });

  it("Logger variables should be properly set", () => {
    const variables = getLoggerOptions({ level: "debug", prettify: true });
    // When getting req id
    expect(variables.transport).toBeTruthy();
    expect(variables.transport?.options).toBeTruthy();
  });

  it("Logger variables should be properly set", () => {
    const variables = getLoggerOptions({ level: "fatal", prettify: false });
    // When getting req id
    expect(variables.transport).toBeFalsy();
    expect(variables.level).toBe("fatal");
  });
});

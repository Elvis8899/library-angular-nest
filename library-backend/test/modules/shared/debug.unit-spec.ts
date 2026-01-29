import { Test } from "@nestjs/testing";
import { FakeLoggerService } from "@shared/logger/adapters/fake/FakeLogger.service";
import { DebugClass } from "@shared/utils/application/debug";
import { FPF } from "@shared/utils/application/monads";
import { PinoLogger } from "nestjs-pino";

let debug: DebugClass;
let logger: PinoLogger;

beforeAll(async () => {
  const moduleRef = await Test.createTestingModule({
    providers: [{ provide: PinoLogger, useClass: FakeLoggerService }],
  }).compile();

  logger = moduleRef.get<PinoLogger>(PinoLogger);
});

describe("[Unit] Debugger", () => {
  it("Debug helpers should successfully work", () => {
    // With a debugger helper
    debug = new DebugClass(logger);

    const spyLoggerDebug = jest.spyOn(logger, "debug");
    const spyTime = jest.spyOn(debug, "time");
    const spyPassThrough = jest.spyOn(debug, "passthrough");
    const spyTimeEnd = jest.spyOn(debug, "timeEnd");
    const spyLog = jest.spyOn(debug, "log");
    const spyPrintTime = jest.spyOn(debug, "printTime");

    // Given a piped value
    const pipedValue = FPF.pipe(
      2,
      debug.time("time"),
      debug.passthrough.bind(debug),
      debug.timeEnd("time"),
      debug.printTime(true),
      debug.time("time2"),
      debug.timeEnd("time2", false),
      debug.timeEnd("time3"),
      debug.log("log"),
      debug.printTime(),
    );

    // It Should remain the same
    expect(pipedValue).toBe(2);

    // And the functions should be called
    expect(spyLoggerDebug).toHaveBeenCalled();
    expect(spyTime).toHaveBeenCalled();
    expect(spyPassThrough).toHaveBeenCalled();
    expect(spyTimeEnd).toHaveBeenCalled();
    expect(spyLog).toHaveBeenCalled();
    expect(spyPrintTime).toHaveBeenCalled();
  });

  it("Should create debugger with default console", () => {
    // Debug creation should not fail with default console
    expect(new DebugClass()).toBeTruthy();
  });
});

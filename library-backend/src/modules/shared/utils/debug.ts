import { PinoLogger } from "nestjs-pino";

/**
 * Helper for testing things locally
 *
 * @example
 * const debug = new DebugClass(logger);
   FPF.pipe(
      2,
      debug.time("time"),
      debug.passthrough,
      debug.timeEnd("time"),
      debug.log("log"),
      debug.printTime(),
    );
 *
 */
export class DebugClass {
  private debugInfo: {
    timers: Record<string, number>;
    counter: Record<string, number>;
  } = {
    timers: {},
    counter: {},
  };
  private timersStart: Record<string, number> = {};

  constructor(private logger: PinoLogger | Console = console) {}

  time(key: string) {
    const time = <U = unknown>(a: U) => {
      this.debugInfo.counter[key] = (this.debugInfo.counter[key] || 0) + 1;
      this.timersStart[key] = performance.now();
      return a;
    };
    return time;
  }

  /**
   * Passthrough. Usefull for using a break point
   */
  passthrough<U>(a: U) {
    return a;
  }

  timeEnd(key: string, cumulative = true) {
    const timeEnd = <U = unknown>(a: U) => {
      const accumulatedTime = cumulative ? this.debugInfo.timers[key] || 0 : 0;

      this.debugInfo.timers[key] =
        accumulatedTime +
        performance.now() -
        (this.timersStart[key] || performance.now());
      return a;
    };
    return timeEnd;
  }

  log(...args: unknown[]) {
    const log = <U = unknown>(a: U) => {
      this.logger.debug(args);
      return a;
    };
    return log;
  }

  printTime(reset = false) {
    const printTime = <U = unknown>(a: U) => {
      this.logger.debug(
        "Timers:",
        this.debugInfo.timers,
        "\n",
        "Counter:",
        this.debugInfo.counter,
      );
      if (reset) {
        this.debugInfo.timers = {};
        this.debugInfo.counter = {};
      }
      return a;
    };
    return printTime;
  }
}

import { Logger } from "@app/services/logger.service";

describe("Logger", () => {
  let logger: Logger;

  beforeEach(() => {
    logger = new Logger("test");
    Logger.level = 0;
  });

  it("Should be created", () => {
    expect(logger).toBeTruthy();
  });

  it("Should be created without source", () => {
    const logger = new Logger();
    expect(logger).toBeTruthy();
    const spy = vi.spyOn(console, "error");
    spy.mockReturnValueOnce(undefined);
    Logger.enableProductionMode();
    logger.error("test");
  });

  it("Should log debug, info, warning and error", () => {
    logger.debug("test");
    logger.info("test");
    logger.warn("test");
    logger.error("test");
  });

  it("Should enable production mode", () => {
    Logger.enableProductionMode();
    expect(Logger.level).toBe(2);
    let check = false;
    Logger.outputs.push(() => {
      check = true;
    });
    const spy = vi.spyOn(console, "error");
    spy.mockReturnValueOnce(undefined);
    logger.error("test");
    expect(check).toBe(true);
  });
});

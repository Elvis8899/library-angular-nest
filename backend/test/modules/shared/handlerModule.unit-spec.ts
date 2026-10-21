import { Injectable, OnModuleInit } from "@nestjs/common";
import { useHandlerModule } from "@test/util/handlerModule";

// init: true runs module.init(), which CQRS needs to register event handlers

@Injectable()
class InitProbe implements OnModuleInit {
  initialized = false;

  onModuleInit() {
    this.initialized = true;
  }
}

describe("[Unit] useHandlerModule", () => {
  describe("With init", () => {
    const ctx = useHandlerModule(
      { providers: [InitProbe], init: true },
      (get) => ({ probe: get(InitProbe) }),
    );

    it("Should initialize the module", () => {
      expect(ctx.probe.initialized).toBe(true);
    });
  });

  describe("Without init", () => {
    const ctx = useHandlerModule({ providers: [InitProbe] }, (get) => ({
      probe: get(InitProbe),
    }));

    it("Should leave the module uninitialized", () => {
      expect(ctx.probe.initialized).toBe(false);
    });
  });
});

import { SpectatorPipe, createPipeFactory } from "@ngneat/spectator/vitest";

import { HumanizePipe } from "@app/shared/pipes/humanize.pipe";

describe("HumanizePipe", () => {
  let spectator: SpectatorPipe<HumanizePipe>;
  const createPipe = createPipeFactory(HumanizePipe);

  it("Should humanize a string", () => {
    spectator = createPipe(`{{ "helloWorld" | humanize: true }}`);
    expect(spectator.element).toHaveText("Hello World");
  });

  it("Should humanize a string", () => {
    spectator = createPipe(`{{ "hello_world" | humanize: false }}`);
    expect(spectator.element).toHaveText("Hello World");
  });

  it("Should humanize a string", () => {
    spectator = createPipe(`{{ "hello-world" | humanize: false }}`);
    expect(spectator.element).toHaveText("Hello World");
  });

  it("Should return empty string", () => {
    spectator = createPipe(`{{ "" | humanize: true }}`);
    expect(spectator.element).toHaveText("");
  });
});

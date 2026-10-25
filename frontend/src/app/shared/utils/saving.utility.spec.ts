import { Logger } from "@app/services/logger.service";
import { NotificationService } from "@app/services/notification.service";
import { injectSaving, Saving } from "@app/shared/utils/saving.utility";
import {
  createInjectionContextFactory,
  SpectatorInjectionContext,
} from "@openng/spectator/vitest";
import { EMPTY, of, Subject, throwError } from "rxjs";

Logger.level = 0;

describe("injectSaving", () => {
  let spectator: SpectatorInjectionContext;
  let saving: Saving;
  const notify = { errorMessage: vi.fn() };
  const log = new Logger("test");
  const createInjectionContext = createInjectionContextFactory({
    providers: [{ provide: NotificationService, useValue: notify }],
  });

  beforeEach(() => {
    notify.errorMessage.mockClear();
    spectator = createInjectionContext();
    saving = spectator.runInInjectionContext(() => injectSaving(log));
  });

  it("Should send one request at a time, saving while it's out", () => {
    // Arrange
    const answer = new Subject<string>();
    const done = vi.fn();
    const again = vi.fn();
    // Act
    saving.run(answer, done);
    saving.run(of("again"), again);
    // Assert
    expect(saving()).toBe(true);
    expect(again).not.toHaveBeenCalled();
    // Act
    answer.next("saved");
    answer.complete();
    // Assert
    expect(done).toHaveBeenCalledWith("saved");
    expect(saving()).toBe(false);
  });

  it("Should show the API's message when it fails", () => {
    // Arrange
    const done = vi.fn();
    // Act
    saving.run(
      throwError(() => ({ message: "Repetida" })),
      done
    );
    // Assert
    expect(notify.errorMessage).toHaveBeenCalledWith("Repetida");
    expect(done).not.toHaveBeenCalled();
    expect(saving()).toBe(false);
    // Act: an error without a body
    saving.run(
      throwError(() => null),
      done
    );
    // Assert
    expect(notify.errorMessage).toHaveBeenLastCalledWith("");
  });

  it("Should let the handlers send again", () => {
    // Arrange
    const done = vi.fn();
    const again = () => saving.run(of("again"), done);
    // Act
    saving.run(of("first"), again);
    saving.run(
      throwError(() => ({ code: "confirm" })),
      done,
      () => {
        again();
        return true;
      }
    );
    // Assert
    expect(done.mock.calls).toEqual([["again"], ["again"]]);
  });

  it("Should end a request that answers nothing", () => {
    // Act
    saving.run(EMPTY, vi.fn());
    // Assert
    expect(saving()).toBe(false);
  });

  it("Should leave the errors it handles to the caller", () => {
    // Arrange
    const refused = vi.fn(({ code }) => code === "worker.duplicateName");
    // Act
    saving.run(
      throwError(() => ({ code: "worker.duplicateName" })),
      vi.fn(),
      refused
    );
    // Assert
    expect(notify.errorMessage).not.toHaveBeenCalled();
    // Act
    saving.run(
      throwError(() => ({ code: "other", message: "Outra" })),
      vi.fn(),
      refused
    );
    saving.run(
      throwError(() => null),
      vi.fn(),
      refused
    );
    // Assert
    expect(refused).toHaveBeenCalledTimes(2);
    expect(notify.errorMessage.mock.calls).toEqual([["Outra"], [""]]);
  });
});

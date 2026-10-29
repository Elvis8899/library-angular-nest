import { TestBed } from "@angular/core/testing";
import { Logger, LogLevel } from "@app/services/logger.service";
import { NotificationService } from "@app/services/notification.service";
import { loading, orNull, reloaded } from "@app/shared/utils/loading.utility";
import { Observable, of, Subject, throwError } from "rxjs";

Logger.level = LogLevel.Off;

describe("loading", () => {
  const log = new Logger("test");
  const notify = { errorMessage: vi.fn() };
  const values = <T>(source: Observable<T>): T[] => {
    const seen: T[] = [];
    source.subscribe((value) => seen.push(value));
    return seen;
  };

  beforeEach(() => notify.errorMessage.mockClear());

  it("Should start undefined, then give the value", () => {
    expect(values(of(1).pipe(loading(log)))).toEqual([undefined, 1]);
  });

  it("Should fail as null, logged without a message by default", () => {
    // Act
    const seen = values(
      throwError(() => ({ message: "Falhou" })).pipe(loading(log)),
    );
    // Assert
    expect(seen).toEqual([undefined, null]);
    expect(notify.errorMessage).not.toHaveBeenCalled();
  });

  it("Should show the API's message given the notifications", () => {
    // Arrange
    const notifications = notify as unknown as NotificationService;
    // Act
    const failed = values(
      throwError(() => ({ message: "Falhou" })).pipe(
        orNull(log, notifications),
      ),
    );
    values(throwError(() => null).pipe(orNull(log, notifications)));
    // Assert
    expect(failed).toEqual([null]);
    expect(notify.errorMessage.mock.calls).toEqual([["Falhou"], [""]]);
  });
});

describe("reloaded", () => {
  const log = new Logger("test");

  it("Should load at once, then again on each trigger, null when it fails", () => {
    // Arrange
    const trigger = new Subject<void>();
    const answers = [of(1), throwError(() => null), of(3)];
    let calls = 0;
    const loaded = TestBed.runInInjectionContext(() =>
      reloaded([trigger], () => answers[calls++] ?? of(0), log),
    );
    // Act & Assert
    expect(loaded()).toBe(1);
    trigger.next();
    expect(loaded()).toBeNull();
    trigger.next();
    expect(loaded()).toBe(3);
  });

  it("Should be undefined while the first load runs", () => {
    const pending = new Subject<number>();
    const loaded = TestBed.runInInjectionContext(() =>
      reloaded([], () => pending, log),
    );

    expect(loaded()).toBeUndefined();
    pending.next(2);
    expect(loaded()).toBe(2);
  });
});

import { Logger } from "@app/services/logger.service";
import { NotificationService } from "@app/services/notification.service";
import { loading, orNull } from "@app/shared/utils/loading.utility";
import { Observable, of, throwError } from "rxjs";

Logger.level = 0;

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
      throwError(() => ({ message: "Falhou" })).pipe(loading(log))
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
      throwError(() => ({ message: "Falhou" })).pipe(orNull(log, notifications))
    );
    values(throwError(() => null).pipe(orNull(log, notifications)));
    // Assert
    expect(failed).toEqual([null]);
    expect(notify.errorMessage.mock.calls).toEqual([["Falhou"], [""]]);
  });
});

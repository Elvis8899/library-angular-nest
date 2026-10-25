import { ApplicationRef } from "@angular/core";
import { MatSnackBar, MatSnackBarDismiss } from "@angular/material/snack-bar";
import { NotificationService } from "@app/services/notification.service";
import { usePtBR } from "@app/shared/utils/test/translations";
import { provideTranslateService, TranslateService } from "@ngx-translate/core";
import {
  createServiceFactory,
  SpectatorService,
} from "@openng/spectator/vitest";
import { firstValueFrom, Subject } from "rxjs";

describe("NotificationService", () => {
  let spectator: SpectatorService<NotificationService>;
  const createService = createServiceFactory({
    providers: [provideTranslateService()],
    service: NotificationService,
  });

  beforeEach(() => {
    spectator = createService();
    const translate = spectator.inject(TranslateService);
    usePtBR(translate);
  });

  // The real snackbar, in the overlay; the newest one, since earlier tests'
  // snackbars are still animating out
  const snackBar = () => {
    spectator.inject(ApplicationRef).tick();
    const all = document.querySelectorAll("mat-snack-bar-container");
    return all.item(all.length - 1) as HTMLElement | null;
  };

  it("Should show a success in the current language, without a button", () => {
    // Act
    spectator.service.success("users.created");
    // Assert
    expect(snackBar()?.textContent).toContain("Usuário criado com sucesso");
    expect(snackBar()?.classList).toContain("notification-success");
    expect(snackBar()?.querySelector("button")).toBeNull();
  });

  it("Should show an error by key, with a close button", () => {
    // Act
    spectator.service.error("errors.unknown");
    // Assert
    expect(snackBar()?.textContent).toContain(
      "Algo deu errado. Tente novamente."
    );
    expect(snackBar()?.classList).toContain("notification-error");
    expect(snackBar()?.querySelector("button")?.textContent).toContain(
      "Fechar"
    );
  });

  it("Should show an error's own text", () => {
    // Act
    spectator.service.errorMessage("CPF já usado");
    // Assert
    expect(snackBar()?.textContent).toContain("CPF já usado");
    expect(snackBar()?.classList).toContain("notification-error");
  });

  it("Should close an error with its button", async () => {
    // Arrange
    const openSpy = vi.spyOn(spectator.inject(MatSnackBar), "open");
    spectator.service.errorMessage("Erro");
    const dismissed = firstValueFrom(
      openSpy.mock.results[0].value.afterDismissed()
    );
    // Act
    (snackBar()?.querySelector("button") as HTMLButtonElement).click();
    // Assert
    expect(await dismissed).toEqual({ dismissedByAction: true });
  });

  it("Should bring a persistent message back after an error is closed", async () => {
    // Arrange
    spectator.service.persistent("update.available", "update.reload");
    spectator.service.errorMessage("Erro");
    expect(snackBar()?.textContent).toContain("Erro");
    // Act
    (snackBar()?.querySelector("button") as HTMLButtonElement).click();
    // Assert
    await vi.waitFor(() =>
      expect(snackBar()?.textContent).toContain(
        "Uma nova versão está disponível."
      )
    );
  });
});

// A snackbar that behaves like Material's for this: opening one dismisses the
// one showing (here at once; Material after its exit animation)
class FakeSnackBarRef {
  private readonly _dismissed = new Subject<MatSnackBarDismiss>();
  private readonly _action = new Subject<void>();

  constructor(
    readonly message: string,
    readonly action?: string
  ) {}

  afterDismissed() {
    return this._dismissed.asObservable();
  }

  onAction() {
    return this._action.asObservable();
  }

  dismiss(dismissedByAction = false) {
    this._dismissed.next({ dismissedByAction });
    this._dismissed.complete();
  }

  pickAction() {
    this._action.next();
    this._action.complete();
    this.dismiss(true);
  }
}

class FakeSnackBar {
  readonly opened: FakeSnackBarRef[] = [];
  current: FakeSnackBarRef | null = null;

  open(message: string, action?: string) {
    const previous = this.current;
    const ref = new FakeSnackBarRef(message, action);
    this.current = ref;
    this.opened.push(ref);
    previous?.dismiss();
    return ref;
  }

  // Closes the one showing, like its duration running out
  closeCurrent() {
    const ref = this.current;
    this.current = null;
    ref?.dismiss();
  }
}

describe("NotificationService persistent messages", () => {
  let spectator: SpectatorService<NotificationService>;
  let snackBar: FakeSnackBar;
  const createService = createServiceFactory({
    service: NotificationService,
    providers: [
      provideTranslateService(),
      { provide: MatSnackBar, useFactory: () => snackBar },
    ],
  });

  beforeEach(() => {
    snackBar = new FakeSnackBar();
    spectator = createService();
  });

  // Without translations, messages are their keys
  const showing = () => snackBar.current?.message;

  it("Should show at once, and emit when its action is picked", () => {
    // Arrange
    const picked = vi.fn();
    // Act
    spectator.service
      .persistent("update.available", "update.reload")
      .subscribe(picked);
    // Assert
    expect(showing()).toBe("update.available");
    expect(snackBar.current?.action).toBe("update.reload");
    // Act
    snackBar.current?.pickAction();
    snackBar.current = null;
    // Assert
    expect(picked).toHaveBeenCalledTimes(1);
    expect(snackBar.opened).toHaveLength(1);
  });

  it("Should return after another message closes", () => {
    // Arrange
    spectator.service.persistent("update.available", "update.reload");
    // Act
    spectator.service.errorMessage("Erro");
    // Assert
    expect(showing()).toBe("Erro");
    // Act
    snackBar.closeCurrent();
    // Assert
    expect(showing()).toBe("update.available");
  });

  it("Should return only after the last of several messages", () => {
    // Arrange
    spectator.service.persistent("update.available", "update.reload");
    // Act
    spectator.service.success("users.created");
    spectator.service.errorMessage("Erro");
    // Assert
    expect(showing()).toBe("Erro");
    // Act
    snackBar.closeCurrent();
    // Assert
    expect(showing()).toBe("update.available");
    expect(snackBar.opened.map((ref) => ref.message)).toEqual([
      "update.available",
      "users.created",
      "Erro",
      "update.available",
    ]);
  });

  it("Should wait for a message already showing", () => {
    // Arrange
    spectator.service.errorMessage("Erro");
    // Act
    spectator.service.persistent("update.available", "update.reload");
    // Assert
    expect(showing()).toBe("Erro");
    // Act
    snackBar.closeCurrent();
    // Assert
    expect(showing()).toBe("update.available");
  });

  it("Should not return once its action was picked", () => {
    // Arrange
    spectator.service.persistent("update.available", "update.reload");
    snackBar.current?.pickAction();
    snackBar.current = null;
    // Act
    spectator.service.success("users.created");
    snackBar.closeCurrent();
    // Assert
    expect(showing()).toBeUndefined();
    expect(snackBar.opened).toHaveLength(2);
  });
});

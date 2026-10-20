import { ApplicationRef } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { NotificationService } from "@app/services/notification.service";
import { ptBR } from "@app/shared/i18n/translations/pt-BR";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import {
  createServiceFactory,
  SpectatorService,
} from "@openng/spectator/vitest";
import { firstValueFrom } from "rxjs";

describe("NotificationService", () => {
  let spectator: SpectatorService<NotificationService>;
  const createService = createServiceFactory({
    service: NotificationService,
    imports: [TranslateModule.forRoot()],
  });

  beforeEach(() => {
    spectator = createService();
    const translate = spectator.inject(TranslateService);
    translate.setTranslation("pt-BR", ptBR);
    translate.use("pt-BR");
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
    spectator.service.success("books.created");
    // Assert
    expect(snackBar()?.textContent).toContain("Livro criado com sucesso");
    expect(snackBar()?.classList).toContain("notification-success");
    expect(snackBar()?.querySelector("button")).toBeNull();
  });

  it("Should show an error by key, with a close button", () => {
    // Act
    spectator.service.error("rentals.rent.noneAvailable");
    // Assert
    expect(snackBar()?.textContent).toContain(
      "Sem livros disponíveis para locação"
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
});

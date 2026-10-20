import { TranslatedPaginatorIntl } from "@app/shared/i18n/translatedPaginatorIntl.service";
import { enUS } from "@app/shared/i18n/translations/en-US";
import { ptBR } from "@app/shared/i18n/translations/pt-BR";
import {
  createServiceFactory,
  SpectatorService,
} from "@ngneat/spectator/vitest";
import { TranslateModule, TranslateService } from "@ngx-translate/core";

describe("TranslatedPaginatorIntl", () => {
  let spectator: SpectatorService<TranslatedPaginatorIntl>;
  let translate: TranslateService;
  const createService = createServiceFactory({
    service: TranslatedPaginatorIntl,
    imports: [TranslateModule.forRoot()],
  });

  beforeEach(() => {
    spectator = createService();
    translate = spectator.inject(TranslateService);
    translate.setTranslation("pt-BR", ptBR);
    translate.setTranslation("en-US", enUS);
  });

  it("Should follow the selected language and notify the paginators", () => {
    // Arrange
    const changed = vi.fn();
    spectator.service.changes.subscribe(changed);
    // Act
    translate.use("pt-BR");
    // Assert
    expect(spectator.service.itemsPerPageLabel).toBe("Itens por página");
    expect(spectator.service.nextPageLabel).toBe("Próxima página");
    expect(spectator.service.previousPageLabel).toBe("Página anterior");
    expect(spectator.service.firstPageLabel).toBe("Primeira página");
    expect(spectator.service.lastPageLabel).toBe("Última página");
    expect(changed).toHaveBeenCalledTimes(1);
    // Act
    translate.use("en-US");
    // Assert
    expect(spectator.service.itemsPerPageLabel).toBe("Items per page");
  });

  it.each([
    [0, 10, 0, "0 de 0"],
    [0, 0, 5, "0 de 5"],
    [0, 10, 3, "1 – 3 de 3"],
    [1, 10, 25, "11 – 20 de 25"],
    [2, 10, 25, "21 – 25 de 25"],
  ])(
    "Should describe page %s of size %s with %s items as %s",
    (page, pageSize, length, label) => {
      // Arrange
      translate.use("pt-BR");
      // Assert
      expect(spectator.service.getRangeLabel(page, pageSize, length)).toBe(
        label
      );
    }
  );
});

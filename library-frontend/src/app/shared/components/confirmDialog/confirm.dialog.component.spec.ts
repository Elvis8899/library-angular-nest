import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import {
  ConfirmDialog,
  ConfirmDialogComponent,
  ConfirmDialogData,
} from "@app/shared/components/confirmDialog/confirm.dialog.component";
import { TypedDialog } from "@app/shared/components/dialog/typedDialog";
import { ptBR } from "@app/shared/i18n/translations/pt-BR";
import {
  createComponentFactory,
  createServiceFactory,
  Spectator,
  SpectatorService,
} from "@ngneat/spectator/vitest";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { of } from "rxjs";

describe("ConfirmDialogComponent", () => {
  let spectator: Spectator<ConfirmDialogComponent>;
  const dialogRef = { close: vi.fn() };
  let data: ConfirmDialogData;
  const createComponent = createComponentFactory({
    component: ConfirmDialogComponent,
    imports: [TranslateModule.forRoot()],
    providers: [
      { provide: MatDialogRef, useValue: dialogRef },
      { provide: MAT_DIALOG_DATA, useFactory: () => data },
    ],
    detectChanges: false,
  });

  beforeEach(() => {
    dialogRef.close.mockClear();
  });

  function create(options: ConfirmDialogData) {
    data = options;
    spectator = createComponent();
    spectator.inject(TranslateService).setTranslation("pt-BR", ptBR);
    spectator.inject(TranslateService).use("pt-BR");
    spectator.detectChanges();
  }

  it("Should show the title, the message with its params and the default label", () => {
    // Act
    create({
      title: "rentals.return.title",
      message: "rentals.return.confirm",
      messageParams: { book: "Dom Casmurro" },
    });
    // Assert
    expect(spectator.query("h2")).toHaveText("Devolver livro");
    expect(spectator.query("mat-dialog-content")).toHaveText(
      "Devolver Dom Casmurro?"
    );
    expect(spectator.query("button[name='confirmDialog']")).toHaveText(
      "Confirmar"
    );
    expect(spectator.query("button[name='confirmDialog']")).not.toHaveClass(
      "destructive"
    );
  });

  it("Should use the given label and the destructive style", () => {
    // Act
    create({
      title: "books.copies.remove",
      message: "books.copies.removeConfirm",
      confirmLabel: "common.remove",
      destructive: true,
    });
    // Assert
    expect(spectator.query("button[name='confirmDialog']")).toHaveText(
      "Remover"
    );
    expect(spectator.query("button[name='confirmDialog']")).toHaveClass(
      "destructive"
    );
  });

  it("Should close with true on confirm and false on cancel", () => {
    // Arrange
    create({
      title: "rentals.return.title",
      message: "rentals.return.confirm",
    });
    // Act
    spectator.click("button[name='confirmDialog']");
    spectator.click("button[name='cancelDialog']");
    // Assert
    expect(dialogRef.close).toHaveBeenNthCalledWith(1, true);
    expect(dialogRef.close).toHaveBeenNthCalledWith(2, false);
  });
});

describe("ConfirmDialog", () => {
  let spectator: SpectatorService<ConfirmDialog>;
  const afterClosed = vi.fn();
  const typedDialogMock = { open: vi.fn(() => ({ afterClosed })) };
  const createService = createServiceFactory({
    service: ConfirmDialog,
    providers: [{ provide: TypedDialog, useValue: typedDialogMock }],
  });

  beforeEach(() => (spectator = createService()));

  it("Should open the dialog with the data", () => {
    // Arrange
    afterClosed.mockReturnValue(of(true));
    const data = {
      title: "rentals.return.title",
      message: "rentals.return.confirm",
    } as const;
    // Act
    spectator.service.confirm(data).subscribe();
    // Assert
    expect(typedDialogMock.open).toHaveBeenCalledWith(ConfirmDialogComponent, {
      data,
      maxWidth: "440px",
    });
  });

  it.each([
    [true, true],
    [false, false],
    // Closed with Escape or a click outside
    [undefined, false],
  ])("Should emit %s as %s", (result, expected) => {
    // Arrange
    afterClosed.mockReturnValue(of(result));
    const emitted = vi.fn();
    // Act
    spectator.service
      .confirm({
        title: "rentals.return.title",
        message: "rentals.return.confirm",
      } as const)
      .subscribe(emitted);
    // Assert
    expect(emitted).toHaveBeenCalledWith(expected);
  });
});

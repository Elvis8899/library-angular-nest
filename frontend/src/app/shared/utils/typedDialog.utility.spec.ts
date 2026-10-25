import { ApplicationRef, Component } from "@angular/core";
import {
  StronglyTypedDialog,
  TypedDialog,
} from "@app/shared/utils/typedDialog.utility";
import {
  createServiceFactory,
  SpectatorService,
} from "@openng/spectator/vitest";
import { firstValueFrom } from "rxjs";

@Component({
  selector: "app-greeting-dialog",
  template: `<p class="greeting">{{ data.name }}</p>`,
})
class GreetingDialogComponent extends StronglyTypedDialog<
  { name: string },
  number
> {
  close(result: number) {
    this.dialogRef.close(result);
  }
}

describe("TypedDialog", () => {
  let spectator: SpectatorService<TypedDialog>;
  const createService = createServiceFactory(TypedDialog);

  beforeEach(() => (spectator = createService()));

  it("Should open the dialog with its data and return its result", async () => {
    // Act
    const ref = spectator.service.open(GreetingDialogComponent, {
      data: { name: "Ana" },
    });
    const closed = firstValueFrom(ref.afterClosed());
    spectator.inject(ApplicationRef).tick();
    // Assert
    expect(document.querySelector(".greeting")?.textContent).toBe("Ana");
    // Act
    (ref.componentInstance as GreetingDialogComponent).close(3);
    // Assert
    expect(await closed).toBe(3);
  });
});

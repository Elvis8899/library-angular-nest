import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatAutocompleteTrigger } from "@angular/material/autocomplete";
import { MatInput } from "@angular/material/input";
import { SuggestionsComponent } from "@app/shared/components/suggestions/suggestions.component";
import { createHostFactory, SpectatorHost } from "@openng/spectator/vitest";

describe("SuggestionsComponent", () => {
  let spectator: SpectatorHost<
    SuggestionsComponent,
    { control: FormControl<string | null>; values: string[] }
  >;
  const createHost = createHostFactory({
    component: SuggestionsComponent,
    imports: [ReactiveFormsModule, MatAutocompleteTrigger, MatInput],
  });
  const options = () =>
    spectator.queryAll("mat-option").map((option) => option.textContent.trim());

  beforeEach(() => {
    spectator = createHost(
      `<input [formControl]="control" [matAutocomplete]="list.panel()" />
       <app-suggestions #list [control]="control" [values]="values" />`,
      {
        hostProps: {
          control: new FormControl<string | null>(""),
          values: ["Pinho", "Pinho tratado", "Eucalipto"],
        },
      },
    );
  });
  const open = () => {
    spectator.focus("input");
    spectator.detectChanges();
  };

  it("Should offer every value before anything is typed", () => {
    // Act
    open();
    // Assert
    expect(options()).toEqual(["Pinho", "Pinho tratado", "Eucalipto"]);
  });

  it("Should offer the values containing what was typed, without itself", () => {
    // Act
    spectator.typeInElement("PINHO", "input");
    open();
    // Assert
    expect(options()).toEqual(["Pinho tratado"]);
  });

  it("Should follow a value set from code", () => {
    // Arrange
    open();
    // Act
    spectator.hostComponent.control.setValue("euca");
    spectator.detectChanges();
    // Assert
    expect(options()).toEqual(["Eucalipto"]);
    // Act
    spectator.hostComponent.control.setValue(null);
    spectator.detectChanges();
    // Assert
    expect(options()).toHaveLength(3);
  });

  it("Should fill the field with the value picked", () => {
    // Arrange
    open();
    // Act
    spectator.click(spectator.queryAll("mat-option")[2]);
    // Assert
    expect(spectator.hostComponent.control.value).toBe("Eucalipto");
  });
});

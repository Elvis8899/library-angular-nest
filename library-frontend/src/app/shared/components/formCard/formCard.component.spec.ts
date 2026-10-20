import { FormCardComponent } from "@app/shared/components/formCard/formCard.component";
import { createHostFactory, SpectatorHost } from "@ngneat/spectator/vitest";
import { TranslateModule } from "@ngx-translate/core";

describe("FormCardComponent", () => {
  let spectator: SpectatorHost<FormCardComponent>;
  const createHost = createHostFactory({
    component: FormCardComponent,
    imports: [TranslateModule.forRoot()],
  });

  it("Should place the fields in the content and the buttons in the actions", () => {
    // Act
    spectator = createHost(
      `<form>
        <app-form-card title="books.create">
          <input name="name" />
          <button formActions name="save" type="submit">Save</button>
        </app-form-card>
      </form>`
    );
    // Assert
    expect(spectator.query("h1")).toHaveText("books.create");
    expect(spectator.query("mat-card-subtitle")).toBeNull();
    expect(spectator.query(".fields input[name='name']")).toBeTruthy();
    // Still inside the <form>, so it submits it
    expect(
      spectator.query(".actions button[name='save']")?.closest("form")
    ).toBeTruthy();
  });

  it("Should show the subtitle when given", () => {
    // Act
    spectator = createHost(
      `<app-form-card title="books.create" subtitle="nav.rentals" />`
    );
    // Assert
    expect(spectator.query("mat-card-subtitle")).toHaveText("nav.rentals");
  });
});

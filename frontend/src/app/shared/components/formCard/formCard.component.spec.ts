import { FormCardComponent } from "@app/shared/components/formCard/formCard.component";
import { provideTranslateService } from "@ngx-translate/core";
import { createHostFactory, SpectatorHost } from "@openng/spectator/vitest";

describe("FormCardComponent", () => {
  let spectator: SpectatorHost<FormCardComponent>;
  const createHost = createHostFactory({
    providers: [provideTranslateService()],
    component: FormCardComponent,
  });

  it("Should place the fields in the content and the buttons in the actions", () => {
    // Act
    spectator = createHost(
      `<form>
        <app-form-card title="users.create">
          <input name="name" />
          <button formActions name="save" type="submit">Save</button>
        </app-form-card>
      </form>`,
    );
    // Assert
    expect(spectator.query("h1")).toHaveText("users.create");
    expect(spectator.query("mat-card-subtitle")).toBeNull();
    expect(spectator.query(".fields input[name='name']")).toBeTruthy();
    // Still inside the <form>, so it submits it
    expect(
      spectator.query(".actions button[name='save']")?.closest("form"),
    ).toBeTruthy();
  });

  it("Should show the subtitle when given", () => {
    // Act
    spectator = createHost(
      `<app-form-card title="users.create" subtitle="users.form.subtitle" />`,
    );
    // Assert
    expect(spectator.query("mat-card-subtitle")).toHaveText(
      "users.form.subtitle",
    );
  });
});

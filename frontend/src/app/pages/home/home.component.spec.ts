import { HomeComponent } from "@app/pages/home/home.component";
import { CredentialsService } from "@app/services/credentials.service";
import { provideTranslateService } from "@ngx-translate/core";
import { createComponentFactory, Spectator } from "@openng/spectator/vitest";

describe("HomeComponent", () => {
  let spectator: Spectator<HomeComponent>;

  const createComponent = createComponentFactory({
    component: HomeComponent,
    providers: [
      provideTranslateService(),
      {
        provide: CredentialsService,
        useValue: { credentials: { user: { name: "Ana" } } },
      },
    ],
  });

  it("Should greet the user", () => {
    spectator = createComponent();
    expect(spectator.component.userName).toBe("Ana");
    expect(spectator.query("h1")).toHaveText("app.home");
  });

  it("Should not fail without credentials", () => {
    spectator = createComponent({
      providers: [{ provide: CredentialsService, useValue: {} }],
    });
    expect(spectator.component.userName).toBe("");
  });
});

import { PageHeaderComponent } from "@app/shared/components/pageHeader/pageHeader.component";
import { provideTranslateService } from "@ngx-translate/core";
import { createHostFactory, SpectatorHost } from "@openng/spectator/vitest";

describe("PageHeaderComponent", () => {
  let spectator: SpectatorHost<PageHeaderComponent>;
  const createHost = createHostFactory({
    providers: [provideTranslateService()],
    component: PageHeaderComponent,
  });

  it("Should show the title and the projected actions", () => {
    // Act
    spectator = createHost(
      `<app-page-header title="users.list.title">
        <button pageActions name="create">Create</button>
      </app-page-header>`,
    );
    // Assert
    expect(spectator.query("h1")).toHaveText("users.list.title");
    expect(spectator.query(".subtitle")).toBeNull();
    // Not the native tooltip, which would show the key
    expect(spectator.element).not.toHaveAttribute("title");
    expect(spectator.query(".actions button[name='create']")).toBeTruthy();
  });

  it("Should show the subtitle when given", () => {
    // Act
    spectator = createHost(
      `<app-page-header title="users.list.title" subtitle="users.form.subtitle" />`,
    );
    // Assert
    expect(spectator.query(".subtitle")).toHaveText("users.form.subtitle");
  });
});

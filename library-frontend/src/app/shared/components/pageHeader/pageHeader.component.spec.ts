import { PageHeaderComponent } from "@app/shared/components/pageHeader/pageHeader.component";
import { createHostFactory, SpectatorHost } from "@ngneat/spectator/vitest";
import { TranslateModule } from "@ngx-translate/core";

describe("PageHeaderComponent", () => {
  let spectator: SpectatorHost<PageHeaderComponent>;
  const createHost = createHostFactory({
    component: PageHeaderComponent,
    imports: [TranslateModule.forRoot()],
  });

  it("Should show the title and the projected actions", () => {
    // Act
    spectator = createHost(
      `<app-page-header title="books.list.title">
        <button pageActions name="create">Create</button>
      </app-page-header>`
    );
    // Assert
    expect(spectator.query("h1")).toHaveText("books.list.title");
    expect(spectator.query(".subtitle")).toBeNull();
    expect(spectator.query(".actions button[name='create']")).toBeTruthy();
  });

  it("Should show the subtitle when given", () => {
    // Act
    spectator = createHost(
      `<app-page-header title="books.list.title" subtitle="nav.rentals" />`
    );
    // Assert
    expect(spectator.query(".subtitle")).toHaveText("nav.rentals");
  });
});

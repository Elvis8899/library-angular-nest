import { signal } from "@angular/core";
import { LoadedDirective } from "@app/shared/directives/loaded.directive";
import { provideTranslateService } from "@ngx-translate/core";
import {
  createDirectiveFactory,
  SpectatorDirective,
} from "@openng/spectator/vitest";

describe("LoadedDirective", () => {
  let spectator: SpectatorDirective<LoadedDirective<string[]>>;
  const rows = signal<string[] | null | undefined>(undefined);
  const createDirective = createDirectiveFactory({
    directive: LoadedDirective<string[]>,
    providers: [provideTranslateService()],
  });
  const render = () => spectator.detectChanges();

  beforeEach(() => {
    rows.set(undefined);
    spectator = createDirective(
      `<div>
        <ul *appLoaded="rows(); let rows; failed: 'x.failed'; empty: 'x.none'">
          @for (row of rows; track row) {
            <li>{{ row }}</li>
          }
        </ul>
      </div>`,
      { hostProps: { rows } },
    );
  });

  it("Should show the progress bar while it loads, then the rows", () => {
    // Assert
    expect(spectator.query("mat-progress-bar")).toExist();
    expect(spectator.query("ul")).not.toExist();
    // Act
    rows.set(["a", "b"]);
    render();
    // Assert
    expect(spectator.query("mat-progress-bar")).not.toExist();
    expect(spectator.queryAll("li").map((li) => li.textContent)).toEqual([
      "a",
      "b",
    ]);
  });

  it("Should say when it failed and when there's nothing", () => {
    // Act
    rows.set(null);
    render();
    // Assert
    expect(spectator.query(".message")).toHaveText("x.failed");
    // Act
    rows.set([]);
    render();
    // Assert
    expect(spectator.query(".message")).toHaveText("x.none");
    expect(spectator.query("ul")).not.toExist();
  });

  it("Should keep the content when the rows load again", () => {
    // Arrange
    rows.set(["a"]);
    render();
    const list = spectator.query("ul");
    // Act
    rows.set(["a", "c"]);
    render();
    // Assert: the same element, with the new rows
    expect(spectator.query("ul")).toBe(list);
    expect(spectator.queryAll("li")).toHaveLength(2);
    // Act: back to loading, then loaded
    rows.set(undefined);
    render();
    expect(spectator.query("ul")).not.toExist();
    rows.set(["d"]);
    render();
    // Assert
    expect(spectator.query("li")).toHaveText("d");
    expect(spectator.query("mat-progress-bar")).not.toExist();
  });
});

describe("LoadedDirective without an empty message", () => {
  const rows = signal<string[] | null | undefined>(undefined);
  const createDirective = createDirectiveFactory({
    directive: LoadedDirective<string[]>,
    providers: [provideTranslateService()],
  });

  it("Should show an empty list", () => {
    // Arrange
    const spectator = createDirective(
      `<p *appLoaded="rows(); let rows; failed: 'x.failed'">{{ rows.length }} rows</p>`,
      { hostProps: { rows } },
    );
    // Act
    rows.set([]);
    spectator.detectChanges();
    // Assert
    expect(spectator.query("p")).toHaveText("0 rows");
  });
});

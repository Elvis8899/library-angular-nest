import { ApplicationRef, signal } from "@angular/core";
import {
  RowAction,
  RowActionsComponent,
} from "@app/shared/components/rowActions/rowActions.component";
import { t } from "@app/shared/i18n/translations/translationKey";
import { provideTranslateService } from "@ngx-translate/core";
import { createHostFactory, SpectatorHost } from "@openng/spectator/vitest";

interface Row {
  id: string;
  active: boolean;
}

describe("RowActionsComponent", () => {
  let spectator: SpectatorHost<RowActionsComponent<Row>>;
  const edit = vi.fn();
  const remove = vi.fn();
  const removes = signal(true);
  const actions: RowAction<Row>[] = [
    { name: "edit", icon: "edit", label: t("common.save"), run: edit },
    {
      name: "remove",
      icon: "delete",
      label: t("common.cancel"),
      run: remove,
      shown: (row) => row.active && removes(),
    },
  ];
  const createHost = createHostFactory({
    component: RowActionsComponent<Row>,
    providers: [provideTranslateService()],
  });
  const open = () => {
    spectator.click("button[name='more']");
    spectator.inject(ApplicationRef).tick();
    return spectator
      .queryAll(".mat-mdc-menu-panel", { root: true })
      .at(-1)!
      .querySelectorAll<HTMLElement>("[mat-menu-item]");
  };
  const host = (row: Row) =>
    createHost(`<app-row-actions [actions]="actions" [row]="row" />`, {
      hostProps: { actions, row },
    });

  beforeEach(() => {
    edit.mockClear();
    remove.mockClear();
    removes.set(true);
  });

  it("Should label its button and run the item picked with the row", () => {
    // Arrange
    const row = { id: "a", active: true };
    spectator = host(row);
    // Assert
    expect(spectator.query("button[name='more']")).toHaveAttribute(
      "aria-label",
      "common.moreActions"
    );
    // Act
    const items = open();
    // Assert
    expect([...items].map((item) => item.getAttribute("name"))).toEqual([
      "edit",
      "remove",
    ]);
    expect(items[1]).toHaveText("common.cancel");
    // Act
    spectator.click(items[1]);
    // Assert
    expect(remove).toHaveBeenCalledWith(row);
    expect(edit).not.toHaveBeenCalled();
  });

  it("Should leave out the items not shown for the row", () => {
    // Arrange
    spectator = host({ id: "b", active: false });
    // Act
    const items = open();
    // Assert
    expect(items).toHaveLength(1);
    expect(items[0]).toHaveAttribute("name", "edit");
  });
});

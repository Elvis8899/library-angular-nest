import { provideHttpClientTesting } from "@angular/common/http/testing";
import { ApplicationRef } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { ROLE } from "@app/models/credentials.entity";
import { UserEntity } from "@app/models/user.entity";
import { PaginatedResponse } from "@app/models/utils/paginatedResponse.entity";
import { ChooseUserDialogComponent } from "@app/pages/books/listBooks/chooseUserDialog/chooseUser.dialog.component";
import { Logger } from "@app/services/logger.service";
import { UserService } from "@app/services/user.http.service";
import { TranslateModule } from "@ngx-translate/core";
import {
  createComponentFactory,
  createSpyObject,
  Spectator,
} from "@openng/spectator/vitest";
import { noop, of, Subject, throwError } from "rxjs";

Logger.level = 0;

describe("ChooseUserDialogComponent", () => {
  let spectator: Spectator<ChooseUserDialogComponent>;
  const user = (id: string, name: string, role = ROLE.CLIENT): UserEntity => ({
    id,
    name,
    email: `${name.toLowerCase().split(" ")[0]}@example.com`,
    cpf: "529.982.247-25",
    role,
    password: "",
    createdAt: new Date().toDateString(),
    updatedAt: new Date().toDateString(),
  });
  const users = [
    user("1", "Ana Souza"),
    user("2", "Bruno Lima"),
    user("3", "Admin", ROLE.ADMIN),
  ];
  const userServiceMock = createSpyObject(UserService);
  const dialogRefMock = { close: vi.fn(noop) };

  const createComponent = createComponentFactory({
    component: ChooseUserDialogComponent,
    imports: [TranslateModule.forRoot()],
    providers: [
      provideHttpClientTesting(),
      { provide: UserService, useValue: userServiceMock },
      {
        provide: MAT_DIALOG_DATA,
        useValue: { book: { name: "Dom Casmurro" } },
      },
      { provide: MatDialogRef, useValue: dialogRefMock },
    ],
  });

  beforeEach(() => {
    dialogRefMock.close.mockClear();
    userServiceMock.getPaginatedUsers.mockReset();
    userServiceMock.getPaginatedUsers.mockReturnValue(
      of({ data: users, count: 3, limit: 1000, page: 0 })
    );
  });

  const optionTexts = () =>
    spectator
      .queryAll("mat-option", { root: true })
      .map((option) => option.textContent?.replace(/\s+/g, " ").trim());

  // The options live in an overlay, outside the fixture's view
  function render() {
    spectator.inject(ApplicationRef).tick();
  }

  function openOptions() {
    spectator.focus("input[name='client']");
    render();
  }

  function search(text: string) {
    spectator.typeInElement(text, "input[name='client']");
    render();
  }

  it("Should load every client at once, without admins", () => {
    // Act
    spectator = createComponent();
    // Assert
    expect(userServiceMock.getPaginatedUsers).toHaveBeenCalledWith({
      page: 0,
      limit: 1000,
    });
    expect(spectator.component.clients().map((u) => u.id)).toEqual(["1", "2"]);
    expect(spectator.query(".intro")).toContainText(
      "rentals.rent.chooseClient"
    );
    expect(spectator.query("mat-progress-bar")).toHaveClass("hidden");
  });

  it("Should show the progress bar while loading", () => {
    // Arrange
    userServiceMock.getPaginatedUsers.mockReturnValue(
      new Subject<PaginatedResponse<UserEntity>>()
    );
    // Act
    spectator = createComponent();
    openOptions();
    // Assert
    expect(spectator.query("mat-progress-bar")).not.toHaveClass("hidden");
    // No "not found" while the clients may still come
    expect(optionTexts()).toEqual([]);
  });

  it("If loading the users fails, should close", () => {
    // Arrange
    userServiceMock.getPaginatedUsers.mockReturnValue(
      throwError(() => new Error())
    );
    // Act
    spectator = createComponent();
    // Assert
    expect(dialogRefMock.close).toHaveBeenCalledTimes(1);
  });

  it("Should search the clients by name or email", () => {
    // Arrange
    spectator = createComponent();
    openOptions();
    // Assert
    expect(optionTexts()).toEqual([
      "Ana Souza ana@example.com",
      "Bruno Lima bruno@example.com",
    ]);
    // Act
    search("BRU");
    // Assert
    expect(optionTexts()).toEqual(["Bruno Lima bruno@example.com"]);
    // Act
    search("nobody");
    // Assert
    expect(optionTexts()).toEqual(["rentals.rent.noClients"]);
  });

  it("Should rent only after a client is picked, closing with their id", () => {
    // Arrange
    spectator = createComponent();
    openOptions();
    // Assert
    expect(spectator.query("button[name='confirmDialog']")).toBeDisabled();
    // Act
    spectator.click(spectator.queryAll("mat-option", { root: true })[1]);
    // Assert
    expect(spectator.query("input[name='client']")).toHaveValue("Bruno Lima");
    // Every client shows again when the panel reopens
    expect(spectator.component.filteredClients()).toHaveLength(2);
    // Act
    spectator.click("button[name='confirmDialog']");
    // Assert
    expect(dialogRefMock.close).toHaveBeenCalledExactlyOnceWith("2");
  });

  it("Should not rent when the search is left without picking a client", () => {
    // Arrange
    spectator = createComponent();
    openOptions();
    search("Bru");
    // Act: requireSelection clears the field when it's left
    spectator.blur("input[name='client']");
    spectator.component.clientControl.setValue(null);
    spectator.detectChanges();
    // Assert
    expect(spectator.query("button[name='confirmDialog']")).toBeDisabled();
  });

  it("Should close without a client on cancel", () => {
    // Arrange
    spectator = createComponent();
    // Act
    spectator.click("button[name='cancelDialog']");
    // Assert
    expect(dialogRefMock.close).toHaveBeenCalledExactlyOnceWith(undefined);
  });
});

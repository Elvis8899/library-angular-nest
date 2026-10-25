import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { ApplicationRef } from "@angular/core";
import { Router, RouterModule } from "@angular/router";
import { AddBooksComponent } from "@app/pages/books/addBook/addBook.component";
import { BookService } from "@app/pages/books/book.http.service";
import { Logger } from "@app/services/logger.service";
import { NotificationService } from "@app/services/notification.service";
import { MockComponent } from "@app/shared/utils/test/mockComponent";
import { provideTranslateService } from "@ngx-translate/core";
import {
  createComponentFactory,
  Spectator,
  SpyObject,
} from "@openng/spectator/vitest";
import { defer, of, Subject, throwError } from "rxjs";

Logger.level = 0;

describe("AddBooksComponent", () => {
  let spectator: Spectator<AddBooksComponent>;
  let httpMock: HttpTestingController;
  let bookServiceMock: SpyObject<BookService>;
  let inputs: Record<"name" | "price" | "cover", HTMLInputElement>;
  const createComponent = createComponentFactory({
    component: AddBooksComponent,
    imports: [
      RouterModule.forRoot([{ path: "books/list", component: MockComponent }]),
    ],
    mocks: [BookService, NotificationService],
    providers: [provideTranslateService(), provideHttpClientTesting()],
  });

  beforeEach(() => {
    spectator = createComponent();
    httpMock = spectator.inject(HttpTestingController);
    bookServiceMock = spectator.inject(BookService);
    bookServiceMock.addBook.mockReturnValue(of({ id: "b1" }));
    bookServiceMock.changeCover.mockReturnValue(of(undefined));
    inputs = {
      name: spectator.query("input[name='name']") as HTMLInputElement,
      price: spectator.query("input[name='price']") as HTMLInputElement,
      cover: spectator.query("input[name='cover']") as HTMLInputElement,
    };
  });

  afterEach(() => {
    httpMock.verify();
    vi.restoreAllMocks();
  });

  function fillIn(name: string, price: string) {
    spectator.typeInElement(name, inputs.name);
    spectator.typeInElement(price, inputs.price);
  }

  const png = new File(["png"], "capa.png", { type: "image/png" });
  function pick(file: File | null) {
    Object.defineProperty(inputs.cover, "files", {
      value: file ? [file] : [],
      configurable: true,
    });
    spectator.dispatchFakeEvent(inputs.cover, "change");
  }
  const cover = () => spectator.query("img.cover") as HTMLImageElement;

  it("Should have a title", () => {
    // Assert
    expect(spectator.query("h1")).toHaveText("books.create");
  });

  it("Should add the book, then its cover, and go back to the list", () => {
    // Arrange
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:capa");
    const navigateSpy = vi.spyOn(spectator.inject(Router), "navigate");
    const notifications = spectator.inject(NotificationService);
    fillIn("Dom Casmurro", "39.9");
    pick(png);
    // Act
    spectator.click("button[name='save']");
    // Assert
    expect(bookServiceMock.addBook).toHaveBeenCalledExactlyOnceWith({
      name: "Dom Casmurro",
      price: 39.9,
    });
    expect(bookServiceMock.changeCover).toHaveBeenCalledExactlyOnceWith(
      "b1",
      png
    );
    expect(notifications.success).toHaveBeenCalledExactlyOnceWith(
      "books.created"
    );
    expect(navigateSpy).toHaveBeenCalledWith(["/books/list"]);
    expect(spectator.component.saving()).toBe(false);
  });

  it("Should add a book without a cover", () => {
    // Arrange
    fillIn("Dom Casmurro", "0");
    // Act
    spectator.click("button[name='save']");
    // Assert
    expect(bookServiceMock.addBook).toHaveBeenCalledWith({
      name: "Dom Casmurro",
      price: 0,
    });
    expect(bookServiceMock.changeCover).not.toHaveBeenCalled();
  });

  it("Should keep the book and say so when its cover doesn't go", () => {
    // Arrange
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:capa");
    const navigateSpy = vi.spyOn(spectator.inject(Router), "navigate");
    const notifications = spectator.inject(NotificationService);
    bookServiceMock.changeCover.mockReturnValue(
      throwError(() => new Error("A capa deve ter até 5 MB."))
    );
    fillIn("Dom Casmurro", "10");
    pick(png);
    // Act
    spectator.click("button[name='save']");
    // Assert
    expect(notifications.error).toHaveBeenCalledExactlyOnceWith(
      "books.form.coverNotSaved"
    );
    expect(notifications.success).not.toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(["/books/list"]);
  });

  it("Should preview the picked cover, and drop it", () => {
    // Arrange
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:capa");
    const revoked = vi.spyOn(URL, "revokeObjectURL").mockReturnValue();
    expect(cover().getAttribute("src")).toBe("images/no-image.png");
    expect(spectator.query("button[name='pickCover']")).toHaveText(
      "books.form.pickCover"
    );
    // Act
    pick(png);
    spectator.detectChanges();
    // Assert
    expect(cover().getAttribute("src")).toBe("blob:capa");
    expect(spectator.query("button[name='pickCover']")).toHaveText(
      "books.cover.change"
    );
    // Act
    spectator.click("button[name='clearCover']");
    spectator.inject(ApplicationRef).tick();
    // Assert
    expect(cover().getAttribute("src")).toBe("images/no-image.png");
    expect(revoked).toHaveBeenCalledWith("blob:capa");
    expect(spectator.query("button[name='clearCover']")).toBeNull();
  });

  it("Should open the file picker, and refuse a file the API would", () => {
    // Arrange
    const clicked = vi.spyOn(inputs.cover, "click");
    const notifications = spectator.inject(NotificationService);
    // Act
    spectator.click("button[name='pickCover']");
    pick(null);
    pick(
      new File([new Uint8Array(6 * 1024 * 1024)], "big.png", {
        type: "image/png",
      })
    );
    spectator.component.pickCover(new Event("change"));
    // Assert
    expect(clicked).toHaveBeenCalledOnce();
    expect(notifications.error).toHaveBeenCalledExactlyOnceWith(
      "books.form.coverTooLarge"
    );
    expect(spectator.component.cover()).toBeNull();
  });

  it("Should show the error when adding fails", () => {
    // Arrange
    const notifications = spectator.inject(NotificationService);
    bookServiceMock.addBook.mockReturnValueOnce(
      throwError(() => new Error("Erro"))
    );
    fillIn("Dom Casmurro", "100");
    // Act
    spectator.click("button[name='save']");
    // Assert
    expect(notifications.errorMessage).toHaveBeenCalledExactlyOnceWith("Erro");
    expect(spectator.component.saving()).toBe(false);
  });

  it("Should show the errors and not save when submitted empty", () => {
    // Act
    spectator.click("button[name='save']");
    // Assert
    expect(bookServiceMock.addBook).not.toHaveBeenCalled();
    const errors = spectator.queryAll("mat-error");
    expect(errors.map((error) => error.textContent?.trim())).toEqual([
      "validation.name.required",
      "books.form.priceInvalid",
    ]);
  });

  it("Should reject a negative price", () => {
    // Arrange
    fillIn("Dom Casmurro", "-1");
    // Act
    spectator.click("button[name='save']");
    // Assert
    expect(bookServiceMock.addBook).not.toHaveBeenCalled();
    expect(
      spectator.queryAll("mat-error").map((e) => e.textContent?.trim())
    ).toEqual(["books.form.priceInvalid"]);
  });

  it("Should show a spinner and ignore new submits while saving", () => {
    // Arrange
    const response = new Subject<{ id: string }>();
    // Counts the requests that go out, not the ones built
    let sent = 0;
    bookServiceMock.addBook.mockImplementation(() =>
      defer(() => {
        sent++;
        return response;
      })
    );
    fillIn("Dom Casmurro", "100");
    // Act
    spectator.click("button[name='save']");
    spectator.component.onSubmit();
    // Assert
    expect(sent).toBe(1);
    expect(spectator.query("button[name='save']")).toBeDisabled();
    expect(spectator.query("mat-progress-spinner")).toBeTruthy();
    // Act
    response.complete();
    spectator.detectChanges();
    // Assert
    expect(spectator.query("button[name='save']")).not.toBeDisabled();
  });

  it("Should link Cancel to the list", () => {
    // Assert
    expect(spectator.query("a[name='cancel']")).toHaveAttribute(
      "href",
      "/books/list"
    );
  });
});

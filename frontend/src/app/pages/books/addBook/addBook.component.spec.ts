import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
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
  let inputs: Record<"name" | "image" | "price", HTMLInputElement>;
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
    bookServiceMock.addBook.mockReturnValue(of(undefined));
    inputs = {
      name: spectator.query("input[name='name']") as HTMLInputElement,
      image: spectator.query("input[name='image']") as HTMLInputElement,
      price: spectator.query("input[name='price']") as HTMLInputElement,
    };
  });

  afterEach(() => {
    httpMock.verify();
  });

  function fillIn(name: string, price: string, image = "") {
    spectator.typeInElement(name, inputs.name);
    spectator.typeInElement(price, inputs.price);
    spectator.typeInElement(image, inputs.image);
  }

  it("Should have a title", () => {
    // Assert
    expect(spectator.query("h1")).toHaveText("books.create");
  });

  it("Should add the book and go back to the list", () => {
    // Arrange
    const navigateSpy = vi.spyOn(spectator.inject(Router), "navigate");
    const notifications = spectator.inject(NotificationService);
    fillIn("Dom Casmurro", "39.9", "https://example.com/cover.jpg");
    // Act
    spectator.click("button[name='save']");
    // Assert
    expect(bookServiceMock.addBook).toHaveBeenCalledExactlyOnceWith({
      name: "Dom Casmurro",
      image: "https://example.com/cover.jpg",
      price: 39.9,
    });
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
      image: "",
      price: 0,
    });
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

  it("Should reject a negative price and a cover that isn't a URL", () => {
    // Arrange
    fillIn("Dom Casmurro", "-1", "cover.jpg");
    // Act
    spectator.click("button[name='save']");
    // Assert
    expect(bookServiceMock.addBook).not.toHaveBeenCalled();
    expect(
      spectator.queryAll("mat-error").map((e) => e.textContent?.trim())
    ).toEqual(["books.form.priceInvalid", "books.form.coverInvalid"]);
  });

  it("Should preview the cover and fall back when it doesn't load", () => {
    // Assert
    const cover = () => spectator.query("img.cover") as HTMLImageElement;
    expect(cover().getAttribute("src")).toBe("images/no-image.png");
    // Act
    spectator.typeInElement("https://example.com/cover.jpg", inputs.image);
    // Assert
    expect(cover().getAttribute("src")).toBe("https://example.com/cover.jpg");
    // Act
    spectator.dispatchFakeEvent(cover(), "error");
    // Assert
    expect(cover().getAttribute("src")).toBe("images/no-image.png");
    // Act: a new URL gets another try
    spectator.typeInElement("https://example.com/other.jpg", inputs.image);
    // Assert
    expect(cover().getAttribute("src")).toBe("https://example.com/other.jpg");
  });

  it("Should not preview an invalid URL", () => {
    // Act
    spectator.typeInElement("cover.jpg", inputs.image);
    // Assert
    expect(spectator.query("img.cover")).toHaveAttribute(
      "src",
      "images/no-image.png"
    );
  });

  it("Should show a spinner and ignore new submits while saving", () => {
    // Arrange
    const response = new Subject<void>();
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

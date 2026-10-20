import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { Router, RouterModule } from "@angular/router";
import { AddBooksComponent } from "@app/pages/books/addBook/addBook.component";
import { BookService } from "@app/services/book.http.service";
import { Logger } from "@app/services/logger.service";
import { LanguagesEnum } from "@app/shared/i18n/translations/allTranslations";
import { ptBR } from "@app/shared/i18n/translations/pt-BR";
import { MockComponent } from "@app/shared/utils/test/mockComponent";
import {
  createComponentFactory,
  Spectator,
  SpyObject,
} from "@ngneat/spectator/vitest";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { HotToastService } from "@ngxpert/hot-toast";
import { of, Subject, throwError } from "rxjs";

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
      TranslateModule.forRoot(),
    ],
    mocks: [BookService, HotToastService],
    providers: [provideHttpClientTesting()],
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
    expect(spectator.query("h1")).toHaveText("Create Book");
  });

  it("Should add the book and go back to the list", () => {
    // Arrange
    const navigateSpy = vi.spyOn(spectator.inject(Router), "navigate");
    const toastService = spectator.inject(HotToastService);
    fillIn("Dom Casmurro", "39.9", "https://example.com/cover.jpg");
    // Act
    spectator.click("button[name='save']");
    // Assert
    expect(bookServiceMock.addBook).toHaveBeenCalledExactlyOnceWith({
      name: "Dom Casmurro",
      image: "https://example.com/cover.jpg",
      price: 39.9,
    });
    expect(toastService.success).toHaveBeenCalledTimes(1);
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

  it("Should show the success toast in the current language", () => {
    // Arrange
    const translate = spectator.inject(TranslateService);
    translate.setTranslation(LanguagesEnum.PT_BR, ptBR);
    translate.use(LanguagesEnum.PT_BR);
    const toastService = spectator.inject(HotToastService);
    fillIn("Dom Casmurro", "100");
    // Act
    spectator.click("button[name='save']");
    // Assert
    expect(toastService.success).toHaveBeenCalledWith(
      "Livro criado com sucesso"
    );
  });

  it("Should show the error when adding fails", () => {
    // Arrange
    const toastService = spectator.inject(HotToastService);
    bookServiceMock.addBook.mockReturnValueOnce(
      throwError(() => new Error("Erro"))
    );
    fillIn("Dom Casmurro", "100");
    // Act
    spectator.click("button[name='save']");
    // Assert
    expect(toastService.error).toHaveBeenCalledExactlyOnceWith("Erro");
    expect(spectator.component.saving()).toBe(false);
  });

  it("Should show the errors and not save when submitted empty", () => {
    // Act
    spectator.click("button[name='save']");
    // Assert
    expect(bookServiceMock.addBook).not.toHaveBeenCalled();
    const errors = spectator.queryAll("mat-error");
    expect(errors.map((error) => error.textContent?.trim())).toEqual([
      "Name is required",
      "Enter a price of 0 or more",
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
    ).toEqual([
      "Enter a price of 0 or more",
      "Enter a URL starting with http:// or https://",
    ]);
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
    bookServiceMock.addBook.mockReturnValueOnce(response);
    fillIn("Dom Casmurro", "100");
    // Act
    spectator.click("button[name='save']");
    spectator.component.onSubmit();
    // Assert
    expect(bookServiceMock.addBook).toHaveBeenCalledTimes(1);
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

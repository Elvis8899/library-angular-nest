import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { RouterModule } from "@angular/router";
import { AddBooksComponent } from "@app/pages/books/addBook/addBook.component";
import { BookService } from "@app/services/book.http.service";
import { Logger } from "@app/services/logger.service";
import { MockComponent } from "@app/shared/utils/test/mockComponent";
import {
  createComponentFactory,
  Spectator,
  SpyObject,
} from "@ngneat/spectator/vitest";
import { TranslateModule } from "@ngx-translate/core";
import { HotToastService } from "@ngxpert/hot-toast";
import { of, throwError } from "rxjs";

Logger.level = 0;

describe("LanguageSelectorComponent", () => {
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

  it("should not have overlay class by default", () => {
    // Assert
    expect(spectator.query("div")).toHaveClass("add-book-wrapper");
  });

  it("Should add user if form is valid", () => {
    spectator.typeInElement("João da Silva", inputs.name);
    spectator.typeInElement("senha123", inputs.image);
    spectator.typeInElement("100", inputs.price);
    const toastService = spectator.inject(HotToastService);

    spectator.detectChanges();
    expect(spectator.query("button")).not.toBeDisabled();
    spectator.click("button");

    expect(bookServiceMock.addBook).toHaveBeenCalledTimes(1);
    expect(toastService.success).toHaveBeenCalledTimes(1);
  });
  it("Should show error if form is valid, but addUser returns error", () => {
    // Arrange
    spectator.typeInElement("João da Silva", inputs.name);
    spectator.typeInElement("senha123", inputs.image);
    spectator.typeInElement("100", inputs.price);
    const toastService = spectator.inject(HotToastService);
    bookServiceMock.addBook.mockReturnValueOnce(throwError(() => new Error()));
    spectator.detectChanges();

    // Act
    expect(spectator.query("button")).not.toBeDisabled();
    spectator.click("button");

    // Assert
    expect(bookServiceMock.addBook).toHaveBeenCalledTimes(1);
    expect(toastService.error).toHaveBeenCalledTimes(1);
  });

  it("should show error if name is invalid", () => {
    spectator.typeInElement("a", inputs.name);
    inputs.price.focus();
    spectator.detectChanges();

    expect(spectator.query(".text-danger")).toContainText("Nome inválido");
  });

  it("should show error if image is invalid", () => {
    spectator.typeInElement("a", inputs.image);
    inputs.price.focus();
    spectator.detectChanges();

    expect(spectator.query(".text-danger")).toContainText("Imagem inválida");
  });

  it("should show error if price is invalid", () => {
    spectator.typeInElement("a", inputs.price);
    inputs.name.focus();
    spectator.detectChanges();

    expect(spectator.query(".text-danger")).toContainText("Preço inválido");
  });
});

import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { Component, signal } from "@angular/core";
import { AuthSrcDirective } from "@app/shared/directives/authSrc.directive";
import { createComponentFactory, Spectator } from "@openng/spectator/vitest";

@Component({
  template: `<img [appAuthSrc]="path()" alt="" fallback="none.png" />`,
  imports: [AuthSrcDirective],
})
class HostComponent {
  readonly path = signal<string | null>("/v1/covers/1");
}

describe("AuthSrcDirective", () => {
  let spectator: Spectator<HostComponent>;
  let http: HttpTestingController;
  const createHost = createComponentFactory({
    component: HostComponent,
    providers: [provideHttpClient(), provideHttpClientTesting()],
  });
  const src = () => spectator.query("img")?.getAttribute("src");

  beforeEach(() => {
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:cover");
    vi.spyOn(URL, "revokeObjectURL").mockReturnValue();
    spectator = createHost();
    http = spectator.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    vi.restoreAllMocks();
  });

  it("Should show the image the API sends, the fallback until then, and free it when it changes", () => {
    expect(src()).toBe("none.png");

    const blob = new Blob(["png"]);
    http.expectOne({ method: "GET", url: "/v1/covers/1" }).flush(blob);
    spectator.detectChanges();

    expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
    expect(src()).toBe("blob:cover");

    spectator.component.path.set(null);
    spectator.detectChanges();

    expect(src()).toBe("none.png");
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:cover");
  });

  it("Should show the fallback when the image fails", () => {
    http
      .expectOne("/v1/covers/1")
      .flush(null, { status: 404, statusText: "Not Found" });
    spectator.detectChanges();

    expect(src()).toBe("none.png");
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });
});

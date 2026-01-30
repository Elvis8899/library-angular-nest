/// <reference types="@angular/localize" />
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AppComponent } from "@app/app.component";

describe("AppComponent", () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let compiled: HTMLElement;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        //{ provide: TranslateService, useClass: ServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    compiled = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  it("should create the app", () => {
    expect(fixture).toBeTruthy();
    expect(component).toBeTruthy();
    expect(compiled).toBeTruthy();
  });
});

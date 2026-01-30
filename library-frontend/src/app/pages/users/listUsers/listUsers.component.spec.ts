import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ROLE } from "@app/models/roles.enum";
import { UserEntity } from "@app/models/user.entity";
import { ListUsersComponent } from "@app/pages/users/listUsers/listUsers.component";
import { Logger } from "@app/services/logger.service";
import { UserService } from "@app/services/user.service";
import { TranslateModule } from "@ngx-translate/core";
import { of, throwError } from "rxjs";
import { vi } from "vitest";

Logger.level = 0;

describe("ListUsersComponent", () => {
  let component: ListUsersComponent;
  let fixture: ComponentFixture<ListUsersComponent>;
  let compiled: HTMLElement;
  const users: UserEntity[] = [
    {
      id: "1",
      name: "test",
      email: "test",
      cpf: "test",
      role: ROLE.ADMIN,
      password: "test",
      createdAt: new Date().toDateString(),
      updatedAt: new Date().toDateString(),
    },
  ];
  const returnError = throwError(() => new Error("error"));
  const userServiceMock = {
    getPaginatedUsers: vi.fn().mockReturnValue(of({ data: users })),
  };
  beforeEach(() => {
    userServiceMock.getPaginatedUsers.mockClear();
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot(), ListUsersComponent],
      providers: [{ provide: UserService, useValue: userServiceMock }],
    }).compileComponents();
    fixture = TestBed.createComponent(ListUsersComponent);
    component = fixture.componentInstance;
    compiled = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(fixture).toBeTruthy();
    expect(component).toBeTruthy();
    expect(compiled).toBeTruthy();
  });

  it("should call getPaginatedUsers on init", () => {
    fixture.detectChanges();
    expect(userServiceMock.getPaginatedUsers).toHaveBeenCalledTimes(1);
  });

  it("should call getPaginatedUsers on refresh", () => {
    expect(userServiceMock.getPaginatedUsers).toHaveBeenCalledTimes(1);
    userServiceMock.getPaginatedUsers.mockReturnValueOnce(returnError);
    component.refresh();
    fixture.detectChanges();
    expect(userServiceMock.getPaginatedUsers).toHaveBeenCalledTimes(2);
  });

  it("should call getPaginatedUsers on refresh", () => {
    expect(userServiceMock.getPaginatedUsers).toHaveBeenCalledTimes(1);
    userServiceMock.getPaginatedUsers.mockReturnValueOnce(of({ data: [] }));
    component.refresh();
    fixture.detectChanges();
    expect(userServiceMock.getPaginatedUsers).toHaveBeenCalledTimes(2);
  });

  it("should call getPaginatedUsers on refresh", () => {
    component.isLoading = true;
    fixture.detectChanges();
    const loading = compiled.querySelector(".loading");
    expect(loading).toBeTruthy();
  });

  it('user click should call "userClicked"', () => {
    const userClickedSpy = vi.spyOn(component, "userClicked");
    compiled.querySelector("td")?.click();
    expect(userClickedSpy).toHaveBeenCalled();
  });

  it('button click should call "goToAddUser"', () => {
    const userClickedSpy = vi.spyOn(component, "goToAddUser");
    compiled.querySelector("button")?.click();
    expect(userClickedSpy).toHaveBeenCalled();
  });
});

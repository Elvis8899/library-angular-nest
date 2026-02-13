import { AsyncPipe } from "@angular/common";
import { Component, inject, OnInit } from "@angular/core";
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import {
  MatDialogActions,
  MatDialogClose,
  MatDialogTitle,
} from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { BookEntity } from "@app/models/book.entity";
import { ROLE } from "@app/models/credentials.entity";
import { UserEntity } from "@app/models/user.entity";
import { Logger } from "@app/services/logger.service";
import { UserService } from "@app/services/user.http.service";
import { StronglyTypedDialog } from "@app/shared/components/dialog/typed-dialog";
import { BehaviorSubject } from "rxjs";

const log = new Logger("ChooseUserDialogComponent");

export interface ChooseUserDialogData {
  book: BookEntity;
}

@Component({
  selector: "app-choose-user-dialog",
  templateUrl: "chooseUser.dialog.component.html",
  imports: [
    AsyncPipe,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    FormsModule,
    MatButtonModule,
    MatSelectModule,
    MatDialogTitle,
    MatDialogActions,
    MatDialogClose,
  ],
})
export class ChooseUserDialogComponent
  extends StronglyTypedDialog<ChooseUserDialogData, string>
  implements OnInit
{
  private readonly _userService = inject(UserService);
  selectedValue!: UserEntity;
  users$: BehaviorSubject<UserEntity[]> = new BehaviorSubject<UserEntity[]>([]);
  selectedCar = "";
  selectUserFormControl = new FormControl("", Validators.required);
  bookName$ = new BehaviorSubject<string>("");

  ngOnInit() {
    this.bookName$.next(this.data.book.name);
    this._userService.getPaginatedUsers().subscribe({
      next: (res) => {
        const users = res.data.filter((u) => u.role !== ROLE.ADMIN);
        this.users$.next(users);
      },
      error: (error) => {
        log.error(error);
        this.onNoClick();
      },
    });
  }
  onNoClick(): void {
    this.dialogRef.close();
  }
}

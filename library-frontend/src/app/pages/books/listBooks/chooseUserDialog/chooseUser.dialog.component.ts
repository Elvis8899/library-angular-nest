import { Component, model } from "@angular/core";
import { FormsModule } from "@angular/forms";
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
import { UserEntity } from "@app/models/user.entity";
import { StronglyTypedDialog } from "@app/shared/components/dialog/typed-dialog";

export interface ChooseUserDialogData {
  users: UserEntity[];
  book: BookEntity;
}

@Component({
  selector: "app-choose-user-dialog",
  templateUrl: "chooseUser.dialog.component.html",
  imports: [
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatButtonModule,
    MatSelectModule,
    MatDialogTitle,
    MatDialogActions,
    MatDialogClose,
  ],
})
export class ChooseUserDialogComponent extends StronglyTypedDialog<
  ChooseUserDialogData,
  string
> {
  selectedValue!: UserEntity;
  selectedCar = "";
  readonly user = model("");
  onNoClick(): void {
    this.dialogRef.close();
  }
}

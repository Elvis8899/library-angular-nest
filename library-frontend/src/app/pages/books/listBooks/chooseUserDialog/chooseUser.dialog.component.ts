import { Component, inject, model } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogRef,
  MatDialogTitle,
} from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { BookEntity } from "@app/models/book.entity";
import { UserEntity } from "@app/models/user.entity";

export interface ChooseUserDialogData {
  users: UserEntity[];
  book: BookEntity;
  user: UserEntity;
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
export class ChooseUserDialogComponent {
  selectedValue!: UserEntity;
  selectedCar = "";

  readonly dialogRef = inject(MatDialogRef<ChooseUserDialogComponent>);
  readonly data = inject<ChooseUserDialogData>(MAT_DIALOG_DATA);
  readonly user = model("");
  onNoClick(): void {
    this.dialogRef.close();
  }
}

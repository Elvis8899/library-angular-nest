import { Directive, inject, Injectable, Type } from "@angular/core";
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogConfig,
  MatDialogRef,
} from "@angular/material/dialog";

// The factory Angular generates has a fallback for building the class
// directly, which can't happen for an abstract class
/* v8 ignore start */
@Directive()
export abstract class StronglyTypedDialog<DialogData, DialogResult> {
  /* v8 ignore stop */
  protected data: DialogData = inject(MAT_DIALOG_DATA);
  protected dialogRef: MatDialogRef<
    StronglyTypedDialog<DialogData, DialogResult>,
    DialogResult
  > = inject(MatDialogRef);
}

@Injectable({ providedIn: "root" })
export class TypedDialog {
  protected dialog = inject(MatDialog);

  open = <DialogData, DialogResult>(
    component: Type<StronglyTypedDialog<DialogData, DialogResult>>,
    config?: MatDialogConfig<DialogData>
  ): MatDialogRef<
    StronglyTypedDialog<DialogData, DialogResult>,
    DialogResult
  > => this.dialog.open(component, config);
}

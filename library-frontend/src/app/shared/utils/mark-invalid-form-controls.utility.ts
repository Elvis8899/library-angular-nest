/**
 * This function recursively marks all form controls as dirty and touched, and scrolls to the first
 * invalid control if provided with a reference element.
 * @param {T} control - The `control` parameter in the `markInvalidFormControls` function represents a
 * form control element in Angular forms. It can be of type `FormGroup`, `FormArray`, or `FormControl`.
 * The function recursively marks all form controls as dirty and touched, and scrolls to the first
 * invalid control if an
 * @param {ElementRef} [elRef] - The `elRef` parameter in the `markInvalidFormControls` function is an
 * optional parameter of type `ElementRef`. It is used to reference an element in the DOM, typically
 * for scrolling purposes when marking form controls as invalid. If provided, the function will scroll
 * to the first invalid control using
 */

import { ElementRef } from "@angular/core";
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
} from "@angular/forms";

export function markInvalidFormControls<T extends AbstractControl>(
  control: T,
  elRef?: ElementRef
): void {
  if (control instanceof FormGroup) {
    const controls = control.controls;
    control.markAllAsTouched();
    Object.values(controls).forEach((ctrl) => {
      ctrl.markAsDirty();
      markInvalidFormControls(ctrl, elRef || undefined);
    });
  } else if (control instanceof FormArray) {
    control.controls.forEach((formControl) => {
      formControl.markAsDirty();
      formControl.markAsTouched();
    });
  } else if (control instanceof FormControl) {
    control.markAsDirty();
    control.markAsTouched();
  } else {
    throw new Error("Error: unexpected control value");
  }
  if (elRef) {
    scrollToFirstInvalidControl(elRef);
  }
}

function scrollToFirstInvalidControl(refElement: ElementRef) {
  const firstInvalidControl: HTMLElement =
    refElement.nativeElement.querySelector("form .ng-invalid");
  if (firstInvalidControl) {
    firstInvalidControl.scrollIntoView({ block: "start", behavior: "smooth" });
    firstInvalidControl.focus();
  }
}

import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";

// CPF and CNPJ check digits, as the API checks them (CheckedDocumentType in
// backend/src/modules/user/domain/document.ts). CNPJs
// may be alphanumeric since July 2026, so letters are kept.
const normalizeDocument = (v: string) =>
  v.toUpperCase().replace(/[^0-9A-Z]/g, "");

// Modulo 11 check digit; characters are valued as their ASCII code - 48
const checkDigit = (base: string, weights: number[]) => {
  const sum = weights.reduce(
    (acc, weight, i) => acc + (base.charCodeAt(i) - 48) * weight,
    0,
  );
  const rest = sum % 11;
  return rest < 2 ? 0 : 11 - rest;
};

const hasValidCheckDigits = (
  doc: string,
  firstWeights: number[],
  secondWeights: number[],
) =>
  checkDigit(doc, firstWeights) === Number(doc.at(-2)) &&
  checkDigit(doc, secondWeights) === Number(doc.at(-1));

const CPF_WEIGHTS = [10, 9, 8, 7, 6, 5, 4, 3, 2];
const CNPJ_WEIGHTS = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

const isValidCPF = (doc: string) =>
  /^\d{11}$/.test(doc) &&
  !/^(\d)\1*$/.test(doc) &&
  hasValidCheckDigits(doc, CPF_WEIGHTS, [11, ...CPF_WEIGHTS]);

const isValidCNPJ = (doc: string) =>
  /^[0-9A-Z]{12}\d{2}$/.test(doc) &&
  !/^(\d)\1*$/.test(doc) &&
  hasValidCheckDigits(doc, CNPJ_WEIGHTS, [6, ...CNPJ_WEIGHTS]);

// A time or date field's value
const timeOf = (group: AbstractControl, name: string) =>
  group.get(name)?.value as string | Date | null | undefined;

export const FormValidatorUtility = {
  removeNonNumeric: (v: string) => v.replace(/\D/g, ""),

  isValidDocument: (v: string) => {
    const doc = normalizeDocument(v);
    return isValidCPF(doc) || isValidCNPJ(doc);
  },

  /** A CPF or CNPJ with valid check digits; empty values pass. */
  validateDocument(): ValidatorFn {
    return ({
      value,
    }: AbstractControl<string | null>): ValidationErrors | null =>
      value && !FormValidatorUtility.isValidDocument(value)
        ? { document: true }
        : null;
  },

  arrayNotEmptyValidator(): ValidatorFn {
    return ({
      value,
    }: AbstractControl<unknown>): Record<string, unknown> | null =>
      Array.isArray(value) && value.length === 0
        ? { arrayNotEmpty: { value } }
        : null;
  },

  /**
   * Creates a validator function to validate that one time is in the future relative to another.
   * @param startControlName The form control name for the start time.
   * @param endControlName The form control name for the end time.
   * @returns A validator function.
   */
  timeRangeValidator(
    startControlName: string,
    endControlName: string,
  ): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const startTime = timeOf(group, startControlName);
      const endTime = timeOf(group, endControlName);
      if (startTime && endTime) {
        const getHourMinute = (time: string | Date) =>
          new Date(time).toTimeString().split(":").map(Number);
        const [startHour, startMinute] = getHourMinute(startTime);
        const [endHour, endMinute] = getHourMinute(endTime);

        const startDate = new Date(2000, 0, 1, startHour, startMinute);
        const endDate = new Date(2000, 0, 1, endHour, endMinute);
        if (endDate <= startDate) {
          // If the end time is not after the start time, return an error object.
          const error = { timeRangeInvalid: true };
          group.get(endControlName)?.setErrors(error);
          return error;
        }
      }

      // If no errors, clear existing errors related to time range validation.
      group.get(endControlName)?.setErrors(null);
      return null; // Return null if no validation errors
    };
  },

  /**
   * Creates a generic validator function to check if one date is after another within the same FormGroup.
   * @param startControlName The form control name for the start date.
   * @param endControlName The form control name for the end date.
   * @returns A validator function that adds an error if the end date is not after the start date.
   */
  dateRangeValidator(
    startControlName: string,
    endControlName: string,
  ): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const startDate = timeOf(group, startControlName);
      const endDate = timeOf(group, endControlName);

      // Check if both dates are present before comparing
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);

        // Check if the end date is after the start date
        if (end <= start) {
          // If not, return an error object on the form group
          const errorObject = { dateRangeInvalid: true };
          // Optionally, set errors directly on the end date control to make handling specific error messages easier
          group.get(endControlName)?.setErrors(errorObject);
          return errorObject;
        }
      }

      // Return null if no validation errors
      return null;
    };
  },
};

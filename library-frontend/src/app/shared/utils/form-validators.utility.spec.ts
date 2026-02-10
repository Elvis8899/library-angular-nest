import { FormControl, FormGroup } from "@angular/forms";
import { FormValidatorUtility } from "@app/shared/utils/form-validators.utility";

describe("removeNonNumeric", () => {
  it("Should remove non numeric", () => {
    const res = FormValidatorUtility.removeNonNumeric(
      "asdasd123120asdasodmpqw2"
    );
    expect(res).toBe("1231202");
  });
});
describe("validateCPF", () => {
  it("Should return null for a valid CPF", () => {
    const res = FormValidatorUtility.validateCPF()(
      new FormControl("123.123.123-12")
    );
    expect(res).toBe(null);
  });

  it("Should return error for an invalid CPF", () => {
    const res = FormValidatorUtility.validateCPF()(
      new FormControl("123.123.123-122321")
    );
    expect(res).toEqual({
      custom: { message: "CPF inválido" },
    });
  });
});

describe("arrayNotEmptyValidator", () => {
  it("Should return null for a non empty array", () => {
    const res = FormValidatorUtility.arrayNotEmptyValidator()(
      new FormControl([1, 2, 3])
    );
    expect(res).toBe(null);
  });

  it("Should return error for an empty array", () => {
    const res = FormValidatorUtility.arrayNotEmptyValidator()(
      new FormControl([])
    );
    expect(res).toEqual({
      arrayNotEmpty: { value: [] },
    });
  });
});

describe("timeRangeValidator", () => {
  const dateA = "createdAt";
  const dateB = "updatedAt";
  let formGroup: FormGroup;

  beforeEach(() => {
    formGroup = new FormGroup(
      {
        [dateA]: new FormControl(),
        [dateB]: new FormControl(),
      },
      FormValidatorUtility.timeRangeValidator(dateA, dateB)
    );
  });

  it("should give error if hours/minutes of dateA >= dateB", () => {
    formGroup.patchValue({
      [dateA]: new Date("2022-01-01T13:00:00.000Z").toString(),
      [dateB]: new Date("2022-01-01T12:00:00.000Z").toString(),
    });
    expect(formGroup.get(dateB)?.errors).toEqual({ timeRangeInvalid: true });
  });

  it("should not give error if hours/minutes of dateA < dateB", () => {
    formGroup.patchValue({
      [dateA]: new Date("2022-01-01T12:00:00.000Z").toString(),
      [dateB]: new Date("2022-01-01T12:01:00.000Z").toString(),
    });
    expect(formGroup.get(dateB)?.errors).toBe(null);
  });
});
describe("dateRangeValidator", () => {
  const dateA = "createdAt";
  const dateB = "updatedAt";
  let formGroup: FormGroup;

  beforeEach(() => {
    formGroup = new FormGroup(
      {
        [dateA]: new FormControl(),
        [dateB]: new FormControl(),
      },
      FormValidatorUtility.dateRangeValidator(dateA, dateB)
    );
  });

  it("should give error if dateA >= dateB", () => {
    formGroup.patchValue({
      [dateA]: new Date("2022-01-01T13:00:00.000Z").toString(),
      [dateB]: new Date("2022-01-01T12:00:00.000Z").toString(),
    });
    expect(formGroup.get(dateB)?.errors).toEqual({ dateRangeInvalid: true });
  });

  it("should not give error if dateA < dateB", () => {
    formGroup.patchValue({
      [dateA]: new Date("2022-01-01T12:00:00.000Z").toString(),
      [dateB]: new Date("2022-01-01T12:01:00.000Z").toString(),
    });
    expect(formGroup.get(dateB)?.errors).toBe(null);
  });
});

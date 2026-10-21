import { FormControl, FormGroup } from "@angular/forms";
import { FormValidatorUtility } from "@app/shared/utils/formValidators.utility";

describe("removeNonNumeric", () => {
  it("Should remove non numeric", () => {
    const res = FormValidatorUtility.removeNonNumeric(
      "asdasd123120asdasodmpqw2"
    );
    expect(res).toBe("1231202");
  });
});
describe("validateDocument", () => {
  it.each([
    ["a CPF", "529.982.247-25"],
    ["a CPF without punctuation", "52998224725"],
    ["a CPF whose check digit is 0", "123.456.704-01"],
    ["a CNPJ", "11.222.333/0001-81"],
    ["an alphanumeric CNPJ", "12.ABC.345/01DE-35"],
    ["a lowercase alphanumeric CNPJ", "12abc34501de35"],
    ["an empty value", ""],
  ])("Should accept %s", (_, value) => {
    const res = FormValidatorUtility.validateDocument()(new FormControl(value));
    expect(res).toBe(null);
  });

  it.each([
    ["a wrong CPF check digit", "529.982.247-26"],
    ["a wrong CNPJ check digit", "11.222.333/0001-82"],
    ["repeated digits", "111.111.111-11"],
    ["a wrong length", "123.456.789"],
    ["letters in a CPF", "52998224A25"],
  ])("Should reject %s", (_, value) => {
    const res = FormValidatorUtility.validateDocument()(new FormControl(value));
    expect(res).toEqual({ document: true });
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

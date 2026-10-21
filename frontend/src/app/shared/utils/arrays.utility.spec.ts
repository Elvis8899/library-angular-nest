import { ArrayUtility } from "@app/shared/utils/arrays.utility";
import { TranslateService } from "@ngx-translate/core";

describe("MoveItemInArray", () => {
  it("should move an item in an array to a new position", () => {
    const array = [1, 2, 3, 4, 5];
    const fromIndex = 2;
    const toIndex = 0;
    const result = ArrayUtility.MoveItemInArray(array, fromIndex, toIndex);
    expect(result).toEqual([3, 1, 2, 4, 5]);
  });

  it("should move an item in an array to a new position", () => {
    const array = [1, 2, 3, 4, 5];
    const fromIndex = 0;
    const toIndex = 2;
    const result = ArrayUtility.MoveItemInArray(array, fromIndex, toIndex);
    expect(result).toEqual([2, 3, 1, 4, 5]);
  });

  it("If indexes are the same, should return the original array", () => {
    const array = [1, 2, 3, 4, 5];
    const fromIndex = 2;
    const toIndex = 2;
    const result = ArrayUtility.MoveItemInArray(array, fromIndex, toIndex);
    expect(result).toEqual([1, 2, 3, 4, 5]);
  });
});

describe("BeautifyArrayOfNumbers", () => {
  it("should beautify an array of numbers", () => {
    const array = [1, "2", 3, "4", 5];
    const result = ArrayUtility.BeautifyArrayOfNumbers(array);
    expect(result).toEqual([1, 2, 3, 4, 5]);
  });

  it("When input is string, should convert to numbers", () => {
    const array = "1, 2, 3, 4, 5";
    const result = ArrayUtility.BeautifyArrayOfNumbers(array);
    expect(result).toEqual([1, 2, 3, 4, 5]);
  });

  it("When input is string array, should convert to numbers", () => {
    const array = "[1, 2, 3, 4, 5]";
    const result = ArrayUtility.BeautifyArrayOfNumbers(array);
    expect(result).toEqual([1, 2, 3, 4, 5]);
  });

  it("When input has error, should return empty array", () => {
    const array = "1,,,2";
    const result = ArrayUtility.BeautifyArrayOfNumbers(array);
    expect(result).toEqual([]);
  });

  it("When input is number, should return empty array", () => {
    const result = ArrayUtility.BeautifyArrayOfNumbers(1 as unknown as string);
    expect(result).toEqual([]);
  });

  it("When input is array with error, should return empty array", () => {
    const result = ArrayUtility.BeautifyArrayOfNumbers(["1,2"]);
    expect(result).toEqual([NaN]);
  });
});

describe("EnumToStringArray", () => {
  it("should convert an enum to an array of strings", () => {
    const enumObj = { A: 1, B: 2, C: 3 };
    const result = ArrayUtility.EnumToStringArray(enumObj);
    expect(result).toEqual(["1", "2", "3"]);
  });

  it("should convert an enum to an array of strings", () => {
    const enumObj = { A: 1, B: 2, C: 3 };
    const result = ArrayUtility.EnumToStringArray(enumObj, true);
    expect(result).toEqual(["A", "B", "C"]);
  });
});

describe("EnumToKeyValueArray", () => {
  it("should convert an enum to an array of key-value pairs", () => {
    const enumObj = { A: 1, B: 2, C: 3 };
    const result = ArrayUtility.EnumToKeyValueArray(enumObj);
    expect(result).toEqual([
      { key: "A", value: "1" },
      { key: "B", value: "2" },
      { key: "C", value: "3" },
    ]);
  });
  const mockTranslateService = {
    instant: (key: string) => key,
  };
  it("should convert an enum to an array of key-value pairs - with translation", () => {
    const enumObj = { A: 1, B: 2, C: 3 };
    const result = ArrayUtility.EnumToKeyValueArray(
      enumObj,
      mockTranslateService as TranslateService
    );
    expect(result).toEqual([
      { key: "A", value: "1" },
      { key: "B", value: "2" },
      { key: "C", value: "3" },
    ]);
  });
});

import { DateTimeUtility } from "@app/shared/utils/date-time.utility";

describe("getDateOnly", () => {
  it("Should return the date in the format dd/MM/yyyy - Date", () => {
    const date = new Date("2022-01-01T12:00:00.000Z");
    const result = DateTimeUtility.getDateOnly(date);
    expect(result).toEqual("01/01/2022");
  });
  it("Should return the date in the format dd/MM/yyyy - string", () => {
    const date = "2022-01-01T12:00:00.000Z";
    const result = DateTimeUtility.getDateOnly(date);
    expect(result).toEqual("01/01/2022");
  });
});

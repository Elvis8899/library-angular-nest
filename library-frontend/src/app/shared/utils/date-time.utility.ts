export class DateTimeUtility {
  /**
   * The function `getDateOnly` returns the date part of a given date string.
   * @param date
   */
  static getDateOnly(date: Date | string): string {
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString("pt-BR");
  }
}

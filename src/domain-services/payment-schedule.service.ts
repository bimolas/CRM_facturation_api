import { Injectable } from '@nestjs/common';

@Injectable()
export class PaymentScheduleService {
  /**
   * Returns the first business day (Monday–Friday) of the given month.
   *
   * @param year  Full year (e.g. 2024)
   * @param month 0-indexed month (0 = January, 11 = December)
   *
   * Requirements: 10.1, 10.2, Property 3
   */
  firstBusinessDayOfMonth(year: number, month: number): Date {
    let day = 1;
    let date = new Date(year, month, day);

    // getDay(): 0 = Sunday, 6 = Saturday
    while (date.getDay() === 0 || date.getDay() === 6) {
      day++;
      date = new Date(year, month, day);
    }

    return date;
  }

  /**
   * Generates one payment installment per calendar month between startDate
   * and endDate (inclusive). Each installment's dueDate is the first business
   * day of that month and its amount equals monthlyAmount.
   *
   * Example: startDate = Jan 15, endDate = Mar 10 → 3 installments (Jan, Feb, Mar)
   *
   * Requirements: 10.1, 10.2, Property 3
   */
  generate(
    startDate: Date,
    endDate: Date,
    monthlyAmount: number,
  ): { dueDate: Date; amount: number }[] {
    const installments: { dueDate: Date; amount: number }[] = [];

    let year = startDate.getFullYear();
    let month = startDate.getMonth();

    const endYear = endDate.getFullYear();
    const endMonth = endDate.getMonth();

    while (year < endYear || (year === endYear && month <= endMonth)) {
      installments.push({
        dueDate: this.firstBusinessDayOfMonth(year, month),
        amount: monthlyAmount,
      });

      month++;
      if (month > 11) {
        month = 0;
        year++;
      }
    }

    return installments;
  }
}

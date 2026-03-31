export class SourceDates {
  activeDate: [Date, Date];
  dates: [Date, Date][] = [];

  get activeValidFrom() {
    return this.activeDate[0];
  }

  get activeValidUntil() {
    return this.activeDate[1];
  }

  init(days = 10, endDate = Temporal.Now.plainDateISO().add({ days: 3 })) {
    this.dates = [];
    for (let i = 0; i <= days; i++) {
      this.dates.push(this.getValidFromUntil(endDate.subtract({ days: i })));
    }
  }

  /**
   * Returns a date that's offset from the activeDate by a given amount.
   *
   * @param offset - Number of days to offset. Can be positive (future) or negative (past).
   * @returns Date offset from the activeDate or null if not found or out of bounds.
   */
  private getDateOffset(offset: number): [Date, Date] | null {
    if (!this.activeDate) {
      return null;
    }

    const index = this.dates.findIndex((d) => d[0].getTime() === this.activeDate[0].getTime());

    if (index === -1 || index + offset < 0 || index + offset >= this.dates.length) {
      return null;
    }

    return this.dates[index + offset];
  }

  getNextDate(): [Date, Date] | null {
    return this.getDateOffset(1);
  }

  getPreviousDate(): [Date, Date] | null {
    return this.getDateOffset(-1);
  }

  getLoadDate() {
    const startDate = this.dates.at(-1);
    const endDate = this.dates.at(0);
    return { startDate, endDate };
  }

  getLoadDateArray(): [Date, Date] {
    const startDate = this.dates.at(-1)[0];
    const endDate = this.dates.at(0)[1];
    return [startDate, endDate];
  }

  private getValidFromUntil(date: Temporal.PlainDate): [Date, Date] {
    const zdt = date.toZonedDateTime({ plainTime: "17:00:00", timeZone: "Europe/Vienna" });
    return [new Date(zdt.subtract({ days: 1 }).epochMilliseconds), new Date(zdt.epochMilliseconds)];
  }

  setActiveDate(date: [Date, Date] | string) {
    if (typeof date === "string") {
      date = this.getValidFromUntil(Temporal.PlainDate.from(date));
    }
    this.activeDate = date;
  }

  hasBeenPublished5PM(date: [Date, Date] = this.activeDate): boolean {
    // date[0] = validFrom = 17:00 = published at
    const published = date[0];
    return Date.now() >= published.getTime();
  }

  hasBeenPublished8AM(date: [Date, Date] = this.activeDate): boolean {
    // date[1] = validUntil = 17:00
    // date[1] at 08:00 = updated at
    const updated = new Date(date[1]);
    updated.setHours(8, 0, 0, 0);
    return new Date().getTime() >= updated.getTime();
  }
}

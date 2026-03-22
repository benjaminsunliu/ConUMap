export enum DayOfWeek {
  Sunday = 0,
  Monday = 1,
  Tuesday = 2,
  Wednesday = 3,
  Thursday = 4,
  Friday = 5,
  Saturday = 6,
}

export namespace DayOfWeek {
  export function toString(day: DayOfWeek): string {
    const names: Record<DayOfWeek, string> = {
      [DayOfWeek.Sunday]: "sunday",
      [DayOfWeek.Monday]: "monday",
      [DayOfWeek.Tuesday]: "tuesday",
      [DayOfWeek.Wednesday]: "wednesday",
      [DayOfWeek.Thursday]: "thursday",
      [DayOfWeek.Friday]: "friday",
      [DayOfWeek.Saturday]: "saturday",
    };
    return names[day];
  }

  export function fromString(day: string): DayOfWeek | null {
    const dayLower = day.toLowerCase();
    const names: Record<string, DayOfWeek> = {
      sunday: DayOfWeek.Sunday,
      monday: DayOfWeek.Monday,
      tuesday: DayOfWeek.Tuesday,
      wednesday: DayOfWeek.Wednesday,
      thursday: DayOfWeek.Thursday,
      friday: DayOfWeek.Friday,
      saturday: DayOfWeek.Saturday,
    };
    return names[dayLower] ?? null;
  }

  export function fromInteger(day: number): DayOfWeek | null {
    if (day < 0 || day > 6) return null;
    return day as DayOfWeek;
  }
}

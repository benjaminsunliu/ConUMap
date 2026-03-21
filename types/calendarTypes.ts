export enum Weekdays {
  Sunday = "sun",
  Monday = "mon",
  Tuesday = "tue",
  Wednesday = "wed",
  Thursday = "thu",
  Friday = "fri",
  Saturday = "sat",
}

export function getWeekdayKey(value: string): keyof typeof Weekdays | undefined {
  return (Object.keys(Weekdays) as (keyof typeof Weekdays)[]).find(
    (key) => Weekdays[key] === value,
  );
}

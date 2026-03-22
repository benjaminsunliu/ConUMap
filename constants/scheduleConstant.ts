export const PIXELS_PER_MINUTE = 0.7;
export const CALENDAR_START_HOUR = 0;
export const CALENDAR_END_HOUR = 24;
export const MINUTES_PER_SLOT = 15;
export const SLOT_HEIGHT = MINUTES_PER_SLOT * PIXELS_PER_MINUTE;
export const HOUR_HEIGHT = 60 * PIXELS_PER_MINUTE;
export const COLUMN_TOTAL_HEIGHT =
  (CALENDAR_END_HOUR - CALENDAR_START_HOUR) * HOUR_HEIGHT;
export const TIME_GUTTER_WIDTH = 44;

function roundStartTimeToSlot(minutes: number): number {
  return Math.floor(minutes / MINUTES_PER_SLOT) * MINUTES_PER_SLOT;
}

function roundEndTimeToSlot(minutes: number): number {
  return Math.ceil(minutes / MINUTES_PER_SLOT) * MINUTES_PER_SLOT;
}

export function timeToPixels(time: string, startOrEnd: string = "start"): number {
  const [hours, minutes] = time.split(":").map(Number);
  const totalMinutes = (hours - CALENDAR_START_HOUR) * 60 + minutes;

  let roundedMinutes = 0;

  if (startOrEnd === "end") {
    roundedMinutes = roundEndTimeToSlot(totalMinutes);
  } else {
    roundedMinutes = roundStartTimeToSlot(totalMinutes);
  }
  return roundedMinutes * PIXELS_PER_MINUTE;
}

export const PALETTE = [
  "#5e0e16",
  "#193764",
  "#46243d",
  "#9f6619",
  "#19645b",
  "#823e42",
  "#ab435e",
  "#a36c70",
];

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

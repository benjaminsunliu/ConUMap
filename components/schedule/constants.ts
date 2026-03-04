export const PIXELS_PER_MINUTES = 0.7;
export const CALENDAR_START_HOUR = 0;
export const CALENDAR_END_HOUR = 24;
export const MINUTES_PER_SLOT = 15;
export const SLOT_HEIGHT = MINUTES_PER_SLOT * PIXELS_PER_MINUTES;
export const HOUR_HEIGHT = 60 * PIXELS_PER_MINUTES;
export const COLUMN_TOTAL_HEIGHT = (CALENDAR_END_HOUR - CALENDAR_START_HOUR) * HOUR_HEIGHT;
export const TIME_GUTTER_WIDTH = 44;

function roundToSlot(minutes: number): number {
    return Math.round(minutes / MINUTES_PER_SLOT) * MINUTES_PER_SLOT;
}

export function timeToPixels(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    const totalMinutes = (hours - CALENDAR_START_HOUR) * 60 + minutes;
    const roundedMinutes = roundToSlot(totalMinutes);
    return roundedMinutes * PIXELS_PER_MINUTES;
}
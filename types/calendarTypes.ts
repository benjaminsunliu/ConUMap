export enum Weekdays{
    Sunday = "sun",
    Monday = "mon",
    Tuesday = "tue",
    Wednesday = "wed",
    Thursday = "thu",
    Friday = "fri",
    Saturday = "sat"
}

export function getWeekdayKey(value: string): keyof typeof Weekdays | undefined {
  return (Object.keys(Weekdays) as (keyof typeof Weekdays)[])
    .find(key => Weekdays[key] === value);
}

export interface ClassInfo {
    STRM: string;
    SUBJECT: string;
    CATALOG_NBR: string;
    SSR_COMPONENT: string;
    XLATLONGNAME: string;
    CLASS_SECTION: string;
    DAY_OF_WEEK: string;
    START_HOURS: string;
    START_MINUTES: string;
    END_HOURS: string;
    END_MINUTES: string;
    CU_BLDG: string;
    CU_BUILDING: string;
    ROOM: string;
    INSTRUCTION_MODE: string;
    EXPR20_20: string;
    START_DT: string;
    END_DT: string;
    ACAD_CAREER: string;
    INSTR_NAME: string;
}
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
    strm: string, 
    subject: string, 
    catalog_nbr: string, 
    ssr_component: string, 
    xlatlongname: string, 
    class_section: string, 
    day_of_week: string, 
    start_hours: string, 
    start_minutes: string, 
    end_hours: string, 
    end_minutes: string, 
    cu_bldg: string, 
    cu_building: string, 
    room: string, 
    instruction_mode: string, 
    expr20_20: string, 
    start_dt: string, 
    end_dt: string, 
    acad_career: string, 
    instr_name: string, 
}

// subject: "SOEN",
// catalogNumber: "345",
// fullName: "Software Testing, Verification and Quality Assurance",
// lecTutLab: "Lecture",
// classSection: "SS",
// instructor: "Hassan Hajjdiab",
// roomCode: "S2.330",
// buildingId: "MB",
// dayOfWeek: [1, 3],
// startHours: "14",
// startMinutes: "45",
// endHours: "16",
// endMinutes: "00",

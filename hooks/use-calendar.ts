export async function fetchCalendarForDate(token: string, date: Date) {
  const requestDate = dateToRequestDate(date);
  const request = `https://prod-dataserv.concordia.ca/SIS/api/Schedule/${token}/${requestDate}/fresh`;
  const response = await fetch(request);
  const text = await response.text();

  // why couldn't they just send normal json smh
  const parsedText = text.replaceAll("\\n", "").replaceAll("\\", "").slice(1, -1);
  const json = JSON.parse(parsedText);
  return json as CalendarResponse;
}

function dateToRequestDate(date: Date) {
  const year = date.getFullYear();

  const month = date.getMonth().toString().padStart(2, "0");
  const day = (date.getDate() - date.getDay()).toString().padStart(2, "0");
  return `${year}${month}${day}`;
}

export type ClassSchedule = {
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
};

type CalendarResponse = {
  status: string;
  scheduleList?: ClassSchedule[];
};

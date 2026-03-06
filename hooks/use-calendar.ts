import { AuthContext } from "@/components/authentication/AuthContextProvider";
import { ONE_DAY_MS } from "@/constants/time";
import { useQuery } from "@tanstack/react-query";
import { useContext } from "react";

export function useCalendar(date: Date) {
  const authContext = useContext(AuthContext);
  return useQuery({
    queryKey: ["fetching-calendar", date],
    queryFn: async () => {
      if (!authContext.isLoggedIn) {
        throw new Error("User is not logged in");
      }
      const response = await fetchCalendarForDate(authContext.data.authToken, date);
      return response.scheduleList || null;
    },
    enabled: false,
  });
}

async function fetchCalendarForDate(token: string, date: Date) {
  const requestDate = dateToRequestDate(date);
  const request = `https://prod-dataserv.concordia.ca/SIS/api/Schedule/${token}/${requestDate}/fresh`;
  const response = await fetch(request);
  const text = await response.text();

  // why couldn't they just send normal json smh
  const parsedText = text.replaceAll(`\n`, "").replaceAll(`\\`, "").slice(1, -1);
  const json = JSON.parse(parsedText);
  return json as CalendarResponse;
}

function dateToRequestDate(date: Date) {
  const daysFromMonday = (date.getDay() + 6) % 7;
  const startOfWeek = new Date(date.getTime() - daysFromMonday * ONE_DAY_MS);
  const year = startOfWeek.getFullYear();
  const month = (startOfWeek.getMonth() + 1).toString().padStart(2, "0");
  const day = startOfWeek.getDate().toString().padStart(2, "0");
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

import { Campus } from "@/scripts/extract-building-info";
import * as cheerio from "cheerio";
import type { CheerioAPI } from "cheerio";

export interface ShuttleScheduleData {
  warnings: string[];
  noServiceDates: Date[];
  isAvailableToday: boolean;
  schedule: Record<Campus, string[]>;
}

/**
 * Checks if the shuttle is running based on current date and parsed exceptions.
 */
function checkAvailability(noServiceDates: Date[]): boolean {
  const now = new Date("2026-03-04T10:00:00"); //TESTING purposes only, replace with current date and time
  const dayOfWeek = now.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return false;
  }
  const isExcluded = noServiceDates.some(
    (date) =>
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate(),
  );

  return !isExcluded;
}

/**
 * Fetches and extracts the Concordia shuttle schedule, warnings, and parsed unavailability dates.
 */
const dateRegex = /\b[a-z]+ (?:[1-9]|[12]\d|3[01]), \d{4}\b/i;

function parseWarnings($: CheerioAPI, dateRegex: RegExp) {
  const warnings: string[] = [];
  const noServiceDates: Date[] = [];

  const selector = "p, h2, h3, h4, strong, span";
  $(selector).each((_: any, el: any) => {
    const text = $(el).text().trim();
    const lowerText = text.toLowerCase();

    const containsKeyword =
      lowerText.includes("no service") ||
      lowerText.includes("schedule in effect") ||
      lowerText.includes("revised schedule") ||
      lowerText.includes("not available");

    if (!containsKeyword || text.length >= 150) {
      return;
    }

    if (warnings.includes(text)) {
      return;
    }

    warnings.push(text.replace(/\s+/g, " ").trim());
    if (lowerText.includes("no service")) {
      const match = dateRegex.exec(text);
      if (match) {
        const dateStr = match[0];
        const parsedDate = new Date(dateStr);
        if (!Number.isNaN(parsedDate.getTime())) {
          const isDuplicate = noServiceDates.some(
            (d) => d.getTime() === parsedDate.getTime(),
          );
          if (!isDuplicate) {
            noServiceDates.push(parsedDate);
          }
        }
      }
    }
  });
  return { warnings, noServiceDates };
}

function parseSchedule($: CheerioAPI, dayOfWeek: number) {
  const loyolaDepartures: string[] = [];
  const sgwDepartures: string[] = [];
  const timeRegex = /^(\d{1,2}:\d{2})/;

  const dayNames = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const todayName = dayNames[dayOfWeek];

  let targetTable: any = null;

  // 1. Try to find a table specifically mentioning today (e.g., "Friday")
  $("table").each((_, table) => {
    const tableText = $(table).text().toLowerCase();
    if (tableText.includes(todayName)) {
      targetTable = table;
      return false; // Found specific match, stop searching
    }
  });

  // 2. Fallback: If no specific day table, find the standard "Monday" table
  if (!targetTable) {
    $("table").each((_, table) => {
      if ($(table).text().toLowerCase().includes("monday")) {
        targetTable = table;
        return false;
      }
    });
  }

  // 3. Parse the identified table
  if (targetTable) {
    let loyColIdx = 0;
    let sgwColIdx = 1;

    $(targetTable)
      .find("tr")
      .each((_, row) => {
        const cols = $(row).find("td, th");

        // Determine column order from headers
        let isHeaderRow = false;
        cols.each((i, col) => {
          const text = $(col).text().toLowerCase();
          if (text.includes("loy")) {
            loyColIdx = i;
            isHeaderRow = true;
          }
          if (text.includes("s.g.w") || text.includes("sgw")) {
            sgwColIdx = i;
            isHeaderRow = true;
          }
        });

        if (!isHeaderRow && cols.length >= 2) {
          const loyText = $(cols[loyColIdx]).text().trim();
          const sgwText = $(cols[sgwColIdx]).text().trim();

          if (timeRegex.test(loyText))
            loyolaDepartures.push(loyText.replace("*", "").trim());
          if (timeRegex.test(sgwText))
            sgwDepartures.push(sgwText.replace("*", "").trim());
        }
      });
  }

  return {
    loyolaDepartures: Array.from(new Set(loyolaDepartures)),
    sgwDepartures: Array.from(new Set(sgwDepartures)),
  };
}

export async function getConcordiaShuttleSchedule(): Promise<ShuttleScheduleData> {
  const url = "https://www.concordia.ca/maps/shuttle-bus.html";
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch page: ${response.statusText}`);
  const html = await response.text();
  const $ = cheerio.load(html);
  const now = new Date("2026-03-04T10:00:00"); //TESTING purposes only, replace with current date and time
  const dayOfWeek = now.getDay();
  const { warnings, noServiceDates } = parseWarnings($, dateRegex);
  const { loyolaDepartures, sgwDepartures } = parseSchedule($, dayOfWeek);
  return {
    warnings,
    noServiceDates,
    isAvailableToday: checkAvailability(noServiceDates),
    schedule: {
      LOY: loyolaDepartures,
      SGW: sgwDepartures,
    },
  };
}

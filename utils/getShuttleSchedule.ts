import * as cheerio from "cheerio";
import type { CheerioAPI } from "cheerio";

export interface ShuttleScheduleData {
  warnings: string[];
  noServiceDates: Date[];
  isAvailableToday: boolean;
  schedule: {
    loyolaDepartures: string[];
    sgwDepartures: string[];
  };
}

/**
 * Checks if the shuttle is running based on current date and parsed exceptions.
 */
function checkAvailability(noServiceDates: Date[]): boolean {
    const now = new Date();
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

    warnings.push(text);
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

function parseSchedule($: CheerioAPI) {
  const loyolaDepartures: string[] = [];
  const sgwDepartures: string[] = [];
  const timeRegex = /^(\d{1,2}:\d{2})/;

  $("table tr").each((_, row) => {
    const cols = $(row).find("td, th");
    if (cols.length < 2) {
      return;
    }
    const col1 = $(cols[0]).text().trim();
    const col2 = $(cols[1]).text().trim();

    if (timeRegex.test(col1)) {
      loyolaDepartures.push(col1.replace("*", "").trim());
    }
    if (timeRegex.test(col2)) {
      sgwDepartures.push(col2.replace("*", "").trim());
    }
  });

  return { loyolaDepartures, sgwDepartures };
}

export async function getConcordiaShuttleSchedule(): Promise<ShuttleScheduleData> {
  const url = "https://www.concordia.ca/maps/shuttle-bus.html";
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch page: ${response.statusText}`);
  }
  const html = await response.text();
  const $ = cheerio.load(html);
  const { warnings, noServiceDates } = parseWarnings($, dateRegex);
  const { loyolaDepartures, sgwDepartures } = parseSchedule($);
  return {
    warnings,
    noServiceDates,
    isAvailableToday: checkAvailability(noServiceDates),
    schedule: {
      loyolaDepartures,
      sgwDepartures,
    },
  };
}

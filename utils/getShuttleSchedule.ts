import * as cheerio from 'cheerio';

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
  const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday

  // 1. Check if it's the weekend (Shuttle only runs Mon-Fri)
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return false;
  }

  // 2. Check if today matches any "No Service" dates
  const isExcluded = noServiceDates.some(date => 
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );

  return !isExcluded;
}

/**
 * Fetches and extracts the Concordia shuttle schedule, warnings, and parsed unavailability dates.
 */
export async function getConcordiaShuttleSchedule(): Promise<ShuttleScheduleData> {
  const url = 'https://www.concordia.ca/maps/shuttle-bus.html';
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch page: ${response.statusText}`);
    }
    const html = await response.text();
    const $ = cheerio.load(html);
    const warnings: string[] = [];
    const noServiceDates: Date[] = [];
    const loyolaDepartures: string[] = [];
    const sgwDepartures: string[] = [];
    const dateRegex = /([a-z]+ \d{1,2}, \d{4})/i;
    $('p, h2, h3, h4, strong, span').each((_, el) => {
      const text = $(el).text().trim();
      const lowerText = text.toLowerCase();
      
      if (
        (lowerText.includes('no service') || 
         lowerText.includes('schedule in effect') ||
         lowerText.includes('revised schedule') ||
         lowerText.includes('not available')) &&
        text.length < 150
      ) {
        if (!warnings.includes(text)) {
          warnings.push(text);
          if (lowerText.includes('no service')) {
            const match = new RegExp(dateRegex).exec(text);
            if (match) {
              const parsedDate = new Date(match[1]);
              if (!Number.isNaN(parsedDate.getTime())) {
                const isDuplicate = noServiceDates.some(
                  d => d.getTime() === parsedDate.getTime()
                );
                
                if (!isDuplicate) {
                  noServiceDates.push(parsedDate);
                }
              }
            }
          }
        }
      }
    });

    $('table tr').each((_, row) => {
      const cols = $(row).find('td, th');      
      if (cols.length >= 2) {
        const col1 = $(cols[0]).text().trim();
        const col2 = $(cols[1]).text().trim();
        const timeRegex = /^(\d{1,2}:\d{2})/;
        if (timeRegex.test(col1)) {
          loyolaDepartures.push(col1.replace("*", "").trim());
        }
        if (timeRegex.test(col2)) {
          sgwDepartures.push(col2.replace("*", "").trim());
        }
      }
    });

    return {
      warnings,
      noServiceDates,
      isAvailableToday: checkAvailability(noServiceDates),
      schedule: {
        loyolaDepartures,
        sgwDepartures,
      }
    };
    
  } catch (error) {
    console.error("Error scraping shuttle data:", error);
    throw error;
  }
}

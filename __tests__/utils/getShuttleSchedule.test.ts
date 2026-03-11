import { mockRouteApi, mockShuttlePage } from "@/data/mock-data/mockRequests";
import { getConcordiaShuttleSchedule } from "@/utils/getShuttleSchedule";

describe("getConcordiaShuttleSchedule", () => {
  const mockHtml = `
    <html>
      <body>
        <h3>Reading Week schedule</h3>
        <p>No service on Friday, March 6, 2026</p>
        <table>
          <thead>
            <tr><th>LOY departures</th><th>S.G.W departures</th></tr>
          </thead>
          <tbody>
            <tr><td>9:15</td><td>9:15</td></tr>
            <tr><td>10:15</td><td>10:45</td></tr>
            <tr><td>18:45*</td><td>18:45*</td></tr>
          </tbody>
        </table>
      </body>
    </html>
  `;

  beforeEach(() => {
    global.fetch = jest.fn().mockImplementation((url: string, options?: any) => {
      if (url.includes("concordia.ca/maps/shuttle-bus.html")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          text: async () => mockShuttlePage,
        } as any);
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ routes: [mockRouteApi] }),
      } as any);
    });

    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  beforeAll(() => {
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should extract warnings and parse "No service" dates correctly', async () => {
    const noServiceHtml = `
        <html>
        <body>
            <p>No service on Friday, March 6, 2026</p>
        </body>
        </html>
    `;
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(noServiceHtml),
    });
    const data = await getConcordiaShuttleSchedule();
    // Verify warnings
    expect(data.warnings).toContain("No service on Friday, March 6, 2026");

    // Verify Date parsing
    expect(data.noServiceDates).toHaveLength(1);
    expect(data.noServiceDates[0]).toBeInstanceOf(Date);

    // Check specific date values
    expect(data.noServiceDates[0].getFullYear()).toBe(2026);
    expect(data.noServiceDates[0].getMonth()).toBe(2);
    expect(data.noServiceDates[0].getDate()).toBe(6);
  });

  it("should extract schedule times into Loyola and SGW arrays", async () => {
    const data = await getConcordiaShuttleSchedule();

    expect(data.schedule["LOY"]).toEqual([
      "9:15",
      "9:30",
      "9:45",
      "10:00",
      "10:15",
      "10:30",
      "10:45",
      "11:00",
      "11:15",
      "11:30",
      "11:45",
      "12:30",
      "12:45",
      "13:00",
      "13:15",
      "13:30",
      "13:45",
      "14:00",
      "14:15",
      "14:30",
      "14:45",
      "15:00",
      "15:15",
      "15:30",
      "15:45",
      "16:30",
      "16:45",
      "17:00",
      "17:15",
      "17:30",
      "17:45",
      "18:00",
      "18:15",
      "18:30",
    ]);
    expect(data.schedule["SGW"]).toEqual([
      "9:30",
      "9:45",
      "10:00",
      "10:15",
      "10:30",
      "10:45",
      "11:00",
      "11:15",
      "11:30",
      "12:15",
      "12:30",
      "12:45",
      "13:00",
      "13:15",
      "13:30",
      "13:45",
      "14:00",
      "14:15",
      "14:30",
      "14:45",
      "15:00",
      "15:15",
      "15:30",
      "16:00",
      "16:15",
      "16:45",
      "17:00",
      "17:15",
      "17:30",
      "17:45",
      "18:00",
      "18:15",
      "18:30",
    ]);
  });

  it("should log error if the fetch fails and return object with empty fields", async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
    });

    
    await expect(getConcordiaShuttleSchedule()).resolves.toEqual({ "isAvailableToday": false, "noServiceDates": [], "schedule": { "LOY": [], "SGW": [] }, "warnings": [] });
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining("Failed to fetch shuttle schedule: 404 Not Found"));
  });

  it("should not add duplicate dates to the noServiceDates array", async () => {
    const duplicateHtml = `
        <html>
        <body>
            <p>No service on Friday, March 6, 2026</p>
            <p>No service on Friday, March 6, 2026</p>
        </body>
        </html>
    `;
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(duplicateHtml),
    });
    const data = await getConcordiaShuttleSchedule();
    expect(data.noServiceDates).toHaveLength(1);
    expect(data.noServiceDates[0].getFullYear()).toBe(2026);
    expect(data.noServiceDates[0].getMonth()).toBe(2);
    expect(data.noServiceDates[0].getDate()).toBe(6);
  });

  describe("Availability Logic", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });
    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return isAvailableToday: false when today is a "No Service" date', async () => {
      jest.setSystemTime(new Date("2026-03-06T12:00:00"));
      const duplicateHtml = `
        <html>
        <body>
            <p>No service on Friday, March 6, 2026</p>
        </body>
        </html>
      `;
      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(duplicateHtml),
      });

      const data = await getConcordiaShuttleSchedule();
      expect(data.isAvailableToday).toBe(false);
    });

    it("should return isAvailableToday: false on weekends", async () => {
      jest.setSystemTime(new Date("2026-03-07T12:00:00"));
      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockHtml),
      });
      const data = await getConcordiaShuttleSchedule();
      expect(data.isAvailableToday).toBe(false);
    });

    it("should return isAvailableToday: true on a standard weekday", async () => {
      jest.setSystemTime(new Date("2026-03-09T12:00:00"));
      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockHtml),
      });
      const data = await getConcordiaShuttleSchedule();
      expect(data.isAvailableToday).toBe(true);
    });
  });
});

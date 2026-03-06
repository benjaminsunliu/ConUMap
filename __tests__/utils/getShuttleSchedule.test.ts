import { getConcordiaShuttleSchedule } from "@/utils/getShuttleSchedule"

describe('getConcordiaShuttleSchedule', () => {
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
    jest.resetAllMocks();
    globalThis.fetch = jest.fn();
  });

  it('should extract warnings and parse "No service" dates correctly', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockHtml),
    });
    const data = await getConcordiaShuttleSchedule();
    // Verify warnings
    expect(data.warnings).toContain('No service on Friday, March 6, 2026');

    // Verify Date parsing
    expect(data.noServiceDates).toHaveLength(1);
    expect(data.noServiceDates[0]).toBeInstanceOf(Date);
    
    // Check specific date values
    expect(data.noServiceDates[0].getFullYear()).toBe(2026);
    expect(data.noServiceDates[0].getMonth()).toBe(2); 
    expect(data.noServiceDates[0].getDate()).toBe(6);
  });

  it('should extract schedule times into Loyola and SGW arrays', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockHtml),
    });

    const data = await getConcordiaShuttleSchedule();

    expect(data.schedule.loyolaDepartures).toEqual(['9:15', '10:15', '18:45']);
    expect(data.schedule.sgwDepartures).toEqual(['9:15', '10:45', '18:45']);
  });

  it('should throw an error if the fetch fails', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      statusText: 'Not Found',
    });
    await expect(getConcordiaShuttleSchedule()).rejects.toThrow('Failed to fetch page: Not Found');
  });
    
    it('should not add duplicate dates to the noServiceDates array', async () => {
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
    
  describe('Availability Logic', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });
    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return isAvailableToday: false when today is a "No Service" date', async () => {
      jest.setSystemTime(new Date('2026-03-06T12:00:00'));
      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockHtml),
      });
      const data = await getConcordiaShuttleSchedule();
      expect(data.isAvailableToday).toBe(false);
    });

    it('should return isAvailableToday: false on weekends', async () => {
      // Set the clock to Saturday, March 7, 2026
      jest.setSystemTime(new Date('2026-03-07T12:00:00'));

      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockHtml),
      });

      const data = await getConcordiaShuttleSchedule();
      
      // Shuttle only runs Monday through Friday
      expect(data.isAvailableToday).toBe(false);
    });

    it('should return isAvailableToday: true on a standard weekday', async () => {
      // Set the clock to Monday, March 9, 2026 (A normal Monday)
      jest.setSystemTime(new Date('2026-03-09T12:00:00'));

      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockHtml),
      });

      const data = await getConcordiaShuttleSchedule();
      expect(data.isAvailableToday).toBe(true);
    });
  });
});
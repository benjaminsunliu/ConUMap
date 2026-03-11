import {
  fetchDirections,
  fetchAllDirections,
  LOY_STOP_COORD,
  SGW_STOP_COORD,
  interCampusPolyline,
  NormalizedRoute,
} from "@/utils/directions";
import { mockRouteApi, mockShuttlePage } from "../data/mock-data/mockRequests";

jest.mock("expo/virtual/env", () => ({ env: process.env }));

const origin = { latitude: 45.4975, longitude: -73.5794 };
const destination = { latitude: 45.5087, longitude: -73.5538 };

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

afterEach(() => {
  jest.restoreAllMocks();
  delete process.env.EXPO_PUBLIC_GOOGLE_API_KEY;
});

describe("fetchDirections", () => {
  it("returns null and warns when EXPO_PUBLIC_GOOGLE_API_KEY is not set", async () => {
    delete process.env.EXPO_PUBLIC_GOOGLE_API_KEY;
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    const result = await fetchDirections(origin, destination, "walking");

    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("EXPO_PUBLIC_GOOGLE_API_KEY"),
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("returns null and warns when the API returns an HTTP error", async () => {
    process.env.EXPO_PUBLIC_GOOGLE_API_KEY = "test-key";
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 403 });
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    const result = await fetchDirections(origin, destination, "walking");

    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Routes API HTTP error: 403"),
    );
  });

  it("returns an empty array when the API returns no routes", async () => {
    process.env.EXPO_PUBLIC_GOOGLE_API_KEY = "test-key";
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ routes: [] }),
    });

    const result = await fetchDirections(origin, destination, "walking");

    expect(result).toEqual([]);
  });

  it("returns empty array when the API returns no 'routes' key", async () => {
    process.env.EXPO_PUBLIC_GOOGLE_API_KEY = "test-key";
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    const result = await fetchDirections(origin, destination, "walking");

    expect(result).toEqual([]);
  });

  it("returns null when a network error occurs", async () => {
    process.env.EXPO_PUBLIC_GOOGLE_API_KEY = "test-key";
    (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const result = await fetchDirections(origin, destination, "driving");

    expect(result).toBeNull();
    expect(errorSpy).toHaveBeenCalledWith(
      "Failed to fetch directions:",
      expect.any(Error),
    );
  });

  it("returns normalized routes on a successful API call", async () => {
    process.env.EXPO_PUBLIC_GOOGLE_API_KEY = "test-key";

    const result = await fetchDirections(origin, destination, "walking");

    expect(result).not.toBeNull();
    expect(result).toHaveLength(1);
    const route = result![0];
    expect(route.summary).toBe("Via Rue Sainte-Catherine O");
    expect(route.overview_polyline.points).toBe("overview_poly_encoded");
    expect(route.legs).toHaveLength(1);
  });

  it("normalizes leg distance and duration correctly", async () => {
    process.env.EXPO_PUBLIC_GOOGLE_API_KEY = "test-key";

    const result = await fetchDirections(origin, destination, "walking");
    const leg = result![0].legs[0];

    expect(leg.distance.value).toBe(2692);
    expect(leg.distance.text).toBe("2.7 km");
    expect(leg.duration.value).toBe(2233);
    expect(leg.duration.text).toBe("37 mins");
  });

  it("formats distances under 1 km as metres", async () => {
    process.env.EXPO_PUBLIC_GOOGLE_API_KEY = "test-key";

    const result = await fetchDirections(origin, destination, "walking");
    const steps = result![0].legs[0].steps;

    expect(steps[0].distance.text).toBe("227 m");
    expect(steps[1].distance.text).toBe("350 m");
  });

  it("formats step duration from staticDuration correctly", async () => {
    process.env.EXPO_PUBLIC_GOOGLE_API_KEY = "test-key";

    const result = await fetchDirections(origin, destination, "walking");
    const steps = result![0].legs[0].steps;

    expect(steps[0].duration.text).toBe("3 mins");
    expect(steps[1].duration.text).toBe("5 mins");
  });

  it("formats duration ≥ 1 hour with hours and minutes", async () => {
    process.env.EXPO_PUBLIC_GOOGLE_API_KEY = "test-key";
    const longRoute = {
      ...mockRouteApi,
      legs: [{ ...mockRouteApi.legs[0], duration: "3900s", steps: [] }],
    };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ routes: [longRoute] }),
    });

    const result = await fetchDirections(origin, destination, "transit");

    expect(result![0].legs[0].duration.text).toBe("1 hr 5 mins");
  });

  it("formats duration at exactly 1 hour", async () => {
    process.env.EXPO_PUBLIC_GOOGLE_API_KEY = "test-key";
    const hourRoute = {
      ...mockRouteApi,
      legs: [{ ...mockRouteApi.legs[0], duration: "3600s", steps: [] }],
    };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ routes: [hourRoute] }),
    });

    const result = await fetchDirections(origin, destination, "driving");

    expect(result![0].legs[0].duration.text).toBe("1 hr");
  });

  it("normalizes step html_instructions from navigationInstruction", async () => {
    process.env.EXPO_PUBLIC_GOOGLE_API_KEY = "test-key";

    const result = await fetchDirections(origin, destination, "walking");
    const step = result![0].legs[0].steps[0];

    expect(step.html_instructions).toBe("Head southeast toward Rte 138 E");
    expect(step.travel_mode).toBe("WALKING");
    expect(step.polyline.points).toBe("step_poly_1");
  });

  it("sets transit_details to undefined for non-transit steps", async () => {
    process.env.EXPO_PUBLIC_GOOGLE_API_KEY = "test-key";

    const result = await fetchDirections(origin, destination, "walking");
    const step = result![0].legs[0].steps[0];

    expect(step.transit_details).toBeUndefined();
  });

  it("normalizes transit steps including vehicle type and stop names", async () => {
    process.env.EXPO_PUBLIC_GOOGLE_API_KEY = "test-key";
    const transitRoute = {
      description: "",
      polyline: { encodedPolyline: "" },
      legs: [
        {
          distanceMeters: 1200,
          duration: "720s",
          steps: [
            {
              distanceMeters: 1200,
              staticDuration: "720s",
              polyline: { encodedPolyline: "transit_poly" },
              navigationInstruction: { instructions: "Take the Metro", maneuver: "" },
              travelMode: "TRANSIT",
              transitDetails: {
                transitLine: {
                  name: "Green Line",
                  nameShort: "Green",
                  vehicle: { type: "SUBWAY" },
                },
                stopDetails: {
                  departureStop: {
                    name: "Guy-Concordia",
                    location: {
                      latLng: { latitude: 45.4905, longitude: -73.5786 },
                    },
                  },
                  arrivalStop: {
                    name: "McGill",
                    location: {
                      latLng: { latitude: 45.5048, longitude: -73.5691 },
                    },
                  },
                },
                localizedValues: {
                  departureTime: { time: { text: "2:00 PM" } },
                  arrivalTime: { time: { text: "2:05 PM" } },
                },
              },
            },
          ],
        },
      ],
    };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ routes: [transitRoute] }),
    });

    const result = await fetchDirections(origin, destination, "transit");
    const step = result![0].legs[0].steps[0];

    expect(step.transit_details).toBeDefined();
    expect(step.transit_details?.line.name).toBe("Green Line");
    expect(step.transit_details?.line.short_name).toBe("Green");
    expect(step.transit_details?.line.vehicle_type).toBe("SUBWAY");
    expect(step.transit_details?.departure_stop.name).toBe("Guy-Concordia");
    expect(step.transit_details?.departure_stop.location).toEqual({
      lat: 45.4905,
      lng: -73.5786,
    });
    expect(step.transit_details?.arrival_stop.name).toBe("McGill");
  });

  it("includes departure_time and arrival_time on legs with transit steps", async () => {
    process.env.EXPO_PUBLIC_GOOGLE_API_KEY = "test-key";
    const transitRoute = {
      description: "",
      polyline: { encodedPolyline: "" },
      legs: [
        {
          distanceMeters: 1200,
          duration: "720s",
          steps: [
            {
              distanceMeters: 1200,
              staticDuration: "720s",
              polyline: { encodedPolyline: "" },
              navigationInstruction: { instructions: "", maneuver: "" },
              travelMode: "TRANSIT",
              transitDetails: {
                transitLine: {
                  name: "Orange Line",
                  nameShort: "Orange",
                  vehicle: { type: "SUBWAY" },
                },
                stopDetails: {
                  departureStop: { name: "Lionel-Groulx" },
                  arrivalStop: { name: "Snowdon" },
                },
                localizedValues: {
                  departureTime: { time: { text: "3:10 PM" } },
                  arrivalTime: { time: { text: "3:15 PM" } },
                },
              },
            },
          ],
        },
      ],
    };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ routes: [transitRoute] }),
    });

    const result = await fetchDirections(origin, destination, "transit");
    const leg = result![0].legs[0];

    expect(leg.departure_time).toEqual({ text: "3:10 PM" });
    expect(leg.arrival_time).toEqual({ text: "3:15 PM" });
  });

  it("sets departure_time and arrival_time to undefined for non-transit legs", async () => {
    process.env.EXPO_PUBLIC_GOOGLE_API_KEY = "test-key";

    const result = await fetchDirections(origin, destination, "walking");
    const leg = result![0].legs[0];

    expect(leg.departure_time).toBeUndefined();
    expect(leg.arrival_time).toBeUndefined();
  });

  it("formats exactly 1 minute as singular '1 min'", async () => {
    process.env.EXPO_PUBLIC_GOOGLE_API_KEY = "test-key";
    const oneMinRoute = {
      ...mockRouteApi,
      legs: [{ ...mockRouteApi.legs[0], duration: "60s", steps: [] }],
    };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ routes: [oneMinRoute] }),
    });

    const result = await fetchDirections(origin, destination, "walking");
    expect(result![0].legs[0].duration.text).toBe("1 min");
  });

  it("formats 1 hr 1 min with singular 'min'", async () => {
    process.env.EXPO_PUBLIC_GOOGLE_API_KEY = "test-key";
    const route = {
      ...mockRouteApi,
      legs: [{ ...mockRouteApi.legs[0], duration: "3660s", steps: [] }],
    };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ routes: [route] }),
    });

    const result = await fetchDirections(origin, destination, "walking");
    expect(result![0].legs[0].duration.text).toBe("1 hr 1 min");
  });

  it("formats 2 hrs with plural 'hrs' and zero remainder", async () => {
    process.env.EXPO_PUBLIC_GOOGLE_API_KEY = "test-key";
    const route = {
      ...mockRouteApi,
      legs: [{ ...mockRouteApi.legs[0], duration: "7200s", steps: [] }],
    };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ routes: [route] }),
    });

    const result = await fetchDirections(origin, destination, "walking");
    expect(result![0].legs[0].duration.text).toBe("2 hrs");
  });

  it("returns 0 seconds for a step with no duration fields", async () => {
    process.env.EXPO_PUBLIC_GOOGLE_API_KEY = "test-key";
    const routeNoDuration = {
      ...mockRouteApi,
      legs: [
        {
          ...mockRouteApi.legs[0],
          duration: "600s",
          steps: [
            {
              distanceMeters: 100,
              polyline: { encodedPolyline: "abc" },
              navigationInstruction: { instructions: "Walk", maneuver: "" },
              travelMode: "WALKING",
            },
          ],
        },
      ],
    };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ routes: [routeNoDuration] }),
    });

    const result = await fetchDirections(origin, destination, "walking");
    expect(result![0].legs[0].steps[0].duration.value).toBe(0);
  });

  it("sets stop location to undefined when no latLng is provided on departure stop", async () => {
    process.env.EXPO_PUBLIC_GOOGLE_API_KEY = "test-key";
    const routeNoLatLng = {
      description: "",
      polyline: { encodedPolyline: "" },
      legs: [
        {
          distanceMeters: 500,
          duration: "300s",
          steps: [
            {
              distanceMeters: 500,
              staticDuration: "300s",
              polyline: { encodedPolyline: "" },
              navigationInstruction: { instructions: "Take bus", maneuver: "" },
              travelMode: "TRANSIT",
              transitDetails: {
                transitLine: { name: "55", nameShort: "55", vehicle: { type: "BUS" } },
                stopDetails: {
                  departureStop: { name: "Stop A" /* no location */ },
                  arrivalStop: { name: "Stop B" /* no location */ },
                },
                localizedValues: {
                  departureTime: { time: { text: "12:00 PM" } },
                  arrivalTime: { time: { text: "12:05 PM" } },
                },
              },
            },
          ],
        },
      ],
    };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ routes: [routeNoLatLng] }),
    });

    const result = await fetchDirections(origin, destination, "transit");
    const step = result![0].legs[0].steps[0];

    expect(step.transit_details?.departure_stop.location).toBeUndefined();
    expect(step.transit_details?.arrival_stop.location).toBeUndefined();
  });

  it("sets route summary to empty string when description is missing", async () => {
    process.env.EXPO_PUBLIC_GOOGLE_API_KEY = "test-key";
    const routeNoDesc = { ...mockRouteApi, description: undefined };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ routes: [routeNoDesc] }),
    });

    const result = await fetchDirections(origin, destination, "walking");
    expect(result![0].summary).toBe("");
  });

  it("handles legs with null/missing steps array gracefully", async () => {
    process.env.EXPO_PUBLIC_GOOGLE_API_KEY = "test-key";
    const routeNoSteps = {
      ...mockRouteApi,
      legs: [{ distanceMeters: 500, duration: "300s" /* no steps key */ }],
    };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ routes: [routeNoSteps] }),
    });

    const result = await fetchDirections(origin, destination, "walking");
    expect(result![0].legs[0].steps).toEqual([]);
  });

  it("sends correct travelMode for each transport type in the request body", async () => {
    process.env.EXPO_PUBLIC_GOOGLE_API_KEY = "test-key";
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ routes: [] }),
    });

    const cases: [Parameters<typeof fetchDirections>[2], string][] = [
      ["walking", "WALK"],
      ["transit", "TRANSIT"],
      ["driving", "DRIVE"],
      ["bicycling", "BICYCLE"],
    ];

    for (const [mode, expectedApiMode] of cases) {
      (global.fetch as jest.Mock).mockClear();
      await fetchDirections(origin, destination, mode);
      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.travelMode).toBe(expectedApiMode);
    }
  });

  it("sends the correct origin and destination coordinates in the request body", async () => {
    process.env.EXPO_PUBLIC_GOOGLE_API_KEY = "test-key";
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ routes: [] }),
    });

    await fetchDirections(origin, destination, "walking");

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.origin.location.latLng).toEqual({
      latitude: origin.latitude,
      longitude: origin.longitude,
    });
    expect(body.destination.location.latLng).toEqual({
      latitude: destination.latitude,
      longitude: destination.longitude,
    });
  });

  it("sends the API key in the request headers", async () => {
    process.env.EXPO_PUBLIC_GOOGLE_API_KEY = "my-secret-key";
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ routes: [] }),
    });

    await fetchDirections(origin, destination, "walking");

    const headers = (global.fetch as jest.Mock).mock.calls[0][1].headers;
    expect(headers["X-Goog-Api-Key"]).toBe("my-secret-key");
  });

  it("requests alternative routes (computeAlternativeRoutes: true)", async () => {
    process.env.EXPO_PUBLIC_GOOGLE_API_KEY = "test-key";
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ routes: [] }),
    });

    await fetchDirections(origin, destination, "driving");

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.computeAlternativeRoutes).toBe(true);
  });
});

describe("fetchAllDirections", () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2024-03-04T12:00:00Z"));
  });

  beforeEach(() => {
    process.env.EXPO_PUBLIC_GOOGLE_API_KEY = "test-key";
    jest.clearAllMocks();
  });

  it("returns routes sorted by duration", async () => {
    const routeShort = {
      ...mockRouteApi,
      description: "Short Route",
      legs: [{ ...mockRouteApi.legs[0], duration: "300s", steps: [] }],
    };
    const routeLong = {
      ...mockRouteApi,
      description: "Long Route",
      legs: [{ ...mockRouteApi.legs[0], duration: "900s", steps: [] }],
    };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ routes: [routeLong, routeShort] }),
    });

    const result = await fetchDirections(origin, destination, "walking");
    expect(result).toHaveLength(2);
    expect(result[0].summary).toBe("Short Route");
    expect(result[1].summary).toBe("Long Route");
  });

  describe("handleShuttleRouting", () => {
    const origin = { latitude: 45.45, longitude: -73.64 };
    const destination = { latitude: 45.5, longitude: -73.58 };

    beforeAll(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2024-03-010T12:00:00Z"));
    });

    beforeEach(() => {
      process.env.EXPO_PUBLIC_GOOGLE_API_KEY = "test-key";
      jest.clearAllMocks();
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it("returns polyline with only shuttle if from bus stop to bus stop", async () => {
      const result = await fetchAllDirections(LOY_STOP_COORD, SGW_STOP_COORD);
      expect(result.shuttle).toHaveLength(1);
      expect(result.shuttle[0].legs).toHaveLength(1);
      expect(result.shuttle[0].legs[0].steps).toHaveLength(1);
      expect(result.shuttle[0].legs[0].steps[0].polyline.points).toBe(
        interCampusPolyline,
      );
    });

    it("returns empty array when preShuttlePath is null", async () => {
      jest.mock("@/utils/getShuttleSchedule", () => ({
        getConcordiaShuttleSchedule: jest.fn().mockResolvedValue({
          isAvailableToday: true,
          schedule: {
            LOY: ["08:00", "09:00"],
            SGW: ["08:30", "09:30"],
          },
        }),
      }));

      jest.mock("../utils/directions", () => ({
        fetchDirections: jest.fn().mockResolvedValue(null),
      }));

      const result = await fetchAllDirections(origin, destination);

      expect(result.shuttle).toEqual([]);
    });

    it("returns null when shuttle is not available today", async () => {
      jest.mock("@/utils/getShuttleSchedule", () => ({
        getConcordiaShuttleSchedule: jest.fn().mockResolvedValue({
          isAvailableToday: false,
          schedule: {
            LOY: ["08:00", "09:00"],
            SGW: ["08:30", "09:30"],
          },
        }),
      }));

      const result = await fetchAllDirections(origin, destination);

      expect(result.shuttle).toEqual([]);
    });

    it("returns null when campusSchedule is null", async () => {
      jest.mock("@/utils/getShuttleSchedule", () => ({
        getConcordiaShuttleSchedule: jest.fn().mockResolvedValue({
          isAvailableToday: true,
          schedule: {},
        }),
      }));

      const result = await fetchAllDirections(origin, destination);

      expect(result.shuttle).toEqual([]);
    });
  });

  it("returns an object with all five transport mode keys", async () => {
    const result = await fetchAllDirections(origin, destination);

    expect(result).toHaveProperty("walking");
    expect(result).toHaveProperty("transit");
    expect(result).toHaveProperty("driving");
    expect(result).toHaveProperty("bicycling");
    expect(result).toHaveProperty("shuttle");
  });

  it("makes exactly 7 fetch calls ( 1 per non-shuttle mode + 1 for shuttle schedule + 2 for walking/transit pre shuttle)", async () => {
    jest.mock("@/utils/getShuttleSchedule", () => ({
      getConcordiaShuttleSchedule: jest.fn().mockResolvedValue({
        isAvailableToday: true,
        schedule: {
          LOY: ["12:00", "13:00"],
          SGW: ["12:30", "13:30"],
        },
      }),
    }));
    
    global.fetch = jest.fn().mockImplementation((url: string, options?: any) => {
      if (url.includes("concordia.ca/maps/shuttle-bus.html")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          text: async () => "",
        } as any);
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ routes: [] }),
      } as any);
    });

    await fetchAllDirections(origin, destination);

    expect(global.fetch).toHaveBeenCalledTimes(7);
  });

  it("handles individual mode failures gracefully, returning null for failed modes", async () => {
    jest.spyOn(console, "warn").mockImplementation(() => { });
    
    // walking ok, transit http error, driving empty, bicycling ok
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ routes: [mockRouteApi] }) })
      .mockResolvedValueOnce({ ok: false, status: 500 })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ routes: [] }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ routes: [mockRouteApi] }),
      })
      .mockResolvedValue({
        ok: true,
        text: async () => "",
        json: async () => ({ routes: [] })
      });

    const result = await fetchAllDirections(origin, destination);

    expect(result.walking).toHaveLength(1);
    expect(result.transit).toBeNull();
    expect(result.driving).toEqual([]);
    expect(result.bicycling).toHaveLength(1);
    expect(result.shuttle).toEqual([]);
  });

  it("returns null for all modes when API key is missing", async () => {
    delete process.env.EXPO_PUBLIC_GOOGLE_API_KEY;
    jest.spyOn(console, "warn").mockImplementation(() => {});

    const result = await fetchAllDirections(origin, destination);

    expect(result.walking).toBeNull();
    expect(result.transit).toBeNull();
    expect(result.driving).toBeNull();
    expect(result.bicycling).toBeNull();
    expect(result.shuttle).toEqual([]);
  });

  it("returns normalized route arrays for all successful modes", async () => {
    const result = await fetchAllDirections(origin, destination);

    (["walking", "transit", "driving", "bicycling"] as const).forEach((mode) => {
      expect(Array.isArray(result[mode])).toBe(true);
      expect(result[mode]).toHaveLength(1);
      expect((result[mode] as any[])[0]).toHaveProperty("summary");
      expect((result[mode] as any[])[0]).toHaveProperty("legs");
    });
  });
});

import { Campus, Coordinate } from "@/types/mapTypes";
import { TransportationMode } from "@/types/buildingTypes";
import { getConcordiaShuttleSchedule } from "@/utils/getShuttleSchedule";
import isEqual from "lodash.isequal";

const ROUTES_BASE_URL = "https://routes.googleapis.com/directions/v2:computeRoutes";
export const interCampusPolyline = "adutGxhb`MvpFnhJ"; // Formatted Map Polyline for the shuttle route between the two campuses
export const LOY_STOP_COORD: Coordinate = {
  latitude: 45.4584539,
  longitude: -73.6389287,
};
export const SGW_STOP_COORD: Coordinate = {
  latitude: 45.4971279,
  longitude: -73.5805579,
};
const DISTANCE_BETWEEN_CAMPUSES = 6700;
const shuttleTransitTime = 30 * 60;

// ---------------------------------------------------------------------------
// Raw Google Routes API v2 shapes
// ---------------------------------------------------------------------------

interface RawLatLng {
  latitude: number;
  longitude: number;
}

interface RawLocation {
  latLng?: RawLatLng;
}

interface RawStop {
  name?: string;
  location?: RawLocation;
}

interface RawStopDetails {
  departureStop?: RawStop;
  arrivalStop?: RawStop;
}

interface RawLocalizedTimeText {
  text?: string;
}

interface RawLocalizedTime {
  time?: RawLocalizedTimeText;
}

interface RawLocalizedValues {
  departureTime?: RawLocalizedTime;
  arrivalTime?: RawLocalizedTime;
}

interface RawVehicle {
  type?: string;
}

interface RawTransitLine {
  name?: string;
  nameShort?: string;
  vehicle?: RawVehicle;
}

interface RawTransitDetails {
  stopDetails?: RawStopDetails;
  localizedValues?: RawLocalizedValues;
  transitLine?: RawTransitLine;
}

interface RawNavigationInstruction {
  instructions?: string;
  maneuver?: string;
}

interface RawPolyline {
  encodedPolyline?: string;
}

interface RawStep {
  distanceMeters?: number;
  staticDuration?: string;
  duration?: string;
  polyline?: RawPolyline;
  navigationInstruction?: RawNavigationInstruction;
  travelMode?: string;
  transitDetails?: RawTransitDetails;
}

interface RawLeg {
  distanceMeters?: number;
  duration?: string;
  steps?: RawStep[];
}

interface RawRoute {
  description?: string;
  polyline?: RawPolyline;
  legs?: RawLeg[];
}

interface RawRoutesResponse {
  routes?: RawRoute[];
}

// ---------------------------------------------------------------------------
// Normalized (app-internal) route shapes
// ---------------------------------------------------------------------------

interface NormalizedTextValue {
  text: string;
  value: number;
}

interface NormalizedLatLng {
  lat: number;
  lng: number;
}

interface NormalizedTransitLine {
  name?: string;
  short_name?: string;
  vehicle_type?: string;
}

interface NormalizedTransitStop {
  name?: string;
  location?: NormalizedLatLng;
}

interface NormalizedTransitDetails {
  line: NormalizedTransitLine;
  departure_stop: NormalizedTransitStop;
  arrival_stop: NormalizedTransitStop;
}

export interface NormalizedStep {
  distance: NormalizedTextValue;
  duration: NormalizedTextValue;
  html_instructions: string;
  maneuver: string;
  polyline: { points: string };
  travel_mode: string;
  transit_details?: NormalizedTransitDetails;
}

export interface NormalizedLeg {
  distance: NormalizedTextValue;
  duration: NormalizedTextValue;
  departure_time?: { text: string };
  arrival_time?: { text: string };
  steps: NormalizedStep[];
}

export interface NormalizedRoute {
  summary: string;
  overview_polyline: { points: string };
  legs: NormalizedLeg[];
  totalDurationSeconds: number;
}

const FIELD_MASK = [
  "routes.description",
  "routes.polyline.encodedPolyline",
  "routes.legs.distanceMeters",
  "routes.legs.duration",
  "routes.legs.steps.distanceMeters",
  "routes.legs.steps.staticDuration",
  "routes.legs.steps.polyline.encodedPolyline",
  "routes.legs.steps.navigationInstruction",
  "routes.legs.steps.travelMode",
  "routes.legs.steps.transitDetails.stopDetails",
  "routes.legs.steps.transitDetails.localizedValues",
  "routes.legs.steps.transitDetails.transitLine.name",
  "routes.legs.steps.transitDetails.transitLine.nameShort",
  "routes.legs.steps.transitDetails.transitLine.vehicle.type",
  "routes.legs.steps.transitDetails.stopDetails.departureStop.name",
  "routes.legs.steps.transitDetails.stopDetails.departureStop.location",
  "routes.legs.steps.transitDetails.stopDetails.arrivalStop.name",
  "routes.legs.steps.transitDetails.stopDetails.arrivalStop.location",
].join(",");

// Helpers

function parseDurationSeconds(d: string | undefined): number {
  if (!d) return 0;
  return Math.round(Number.parseFloat(d.replace("s", ""))) || 0;
}

function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);

  if (mins < 60) {
    return `${mins} min${mins === 1 ? "" : "s"}`;
  }

  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  const hrsText = `${hrs} hr${hrs === 1 ? "" : "s"}`;
  const minsText = `${rem} min${rem === 1 ? "" : "s"}`;

  return rem > 0 ? `${hrsText} ${minsText}` : hrsText;
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${meters} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function normalizeRoute(route: RawRoute): NormalizedRoute {
  const legs = (route.legs ?? []).map((leg): NormalizedLeg => {
    const durationSeconds = parseDurationSeconds(leg.duration);

    const steps = (leg.steps ?? []).map((step): NormalizedStep => {
      const stepDurationSeconds = parseDurationSeconds(
        step.staticDuration ?? step.duration,
      );
      const transitDetails = step.transitDetails;

      return {
        distance: {
          text: formatDistance(step.distanceMeters ?? 0),
          value: step.distanceMeters ?? 0,
        },
        duration: {
          text: formatDuration(stepDurationSeconds),
          value: stepDurationSeconds,
        },
        html_instructions: step.navigationInstruction?.instructions ?? "",
        maneuver: step.navigationInstruction?.maneuver ?? "",
        polyline: { points: step.polyline?.encodedPolyline ?? "" },
        travel_mode: step.travelMode ?? "WALKING",
        transit_details: transitDetails
          ? {
              line: {
                name: transitDetails.transitLine?.name,
                short_name: transitDetails.transitLine?.nameShort,
                vehicle_type: transitDetails.transitLine?.vehicle?.type,
              },
              departure_stop: {
                name: transitDetails.stopDetails?.departureStop?.name,
                location: transitDetails.stopDetails?.departureStop?.location?.latLng
                  ? {
                      lat: transitDetails.stopDetails.departureStop.location.latLng
                        .latitude,
                      lng: transitDetails.stopDetails.departureStop.location.latLng
                        .longitude,
                    }
                  : undefined,
              },
              arrival_stop: {
                name: transitDetails.stopDetails?.arrivalStop?.name,
                location: transitDetails.stopDetails?.arrivalStop?.location?.latLng
                  ? {
                      lat: transitDetails.stopDetails.arrivalStop.location.latLng
                        .latitude,
                      lng: transitDetails.stopDetails.arrivalStop.location.latLng
                        .longitude,
                    }
                  : undefined,
              },
            }
          : undefined,
      };
    });

    const firstTransitStep = leg.steps?.find(
      (step) => step.transitDetails?.localizedValues,
    );
    const lastTransitStep = [...(leg.steps ?? [])]
      .reverse()
      .find((step) => step.transitDetails?.localizedValues);

    const departureText =
      firstTransitStep?.transitDetails?.localizedValues?.departureTime?.time?.text;
    const arrivalText =
      lastTransitStep?.transitDetails?.localizedValues?.arrivalTime?.time?.text;

    return {
      distance: {
        text: formatDistance(leg.distanceMeters ?? 0),
        value: leg.distanceMeters ?? 0,
      },
      duration: {
        text: formatDuration(durationSeconds),
        value: durationSeconds,
      },
      departure_time: departureText ? { text: departureText } : undefined,
      arrival_time: arrivalText ? { text: arrivalText } : undefined,
      steps,
    };
  });

  return {
    summary: route.description ?? "",
    overview_polyline: { points: route.polyline?.encodedPolyline ?? "" },
    legs,
    totalDurationSeconds: legs.reduce((total, leg) => total + leg.duration.value, 0),
  };
}

export type ShuttleSegmentMode = Extract<TransportationMode, "transit" | "walking">;

/**
 * Selects the optimal shuttle segment path between two coordinates based on total duration of transportation.
 * Returns null if no valid shuttle path exists.
 * Origin or destination may be at/near either campus, but not necessarily both.
 *
 * Compares both transit and walking routes and returns the faster option.
 * Prioritizes transit if it's faster or equal to walking duration.
 * Falls back to walking if transit is unavailable.
 *
 * @param origin - The starting coordinate
 * @param destination - The ending coordinate
 * @returns A promise that resolves to the optimal normalized route, or null if no valid path exists
 */
async function chooseShuttleSegmentPath(
  origin: Coordinate,
  destination: Coordinate,
): Promise<NormalizedRoute | null> {
  const transitPath = await fetchDirections(origin, destination, "transit");
  const walkingPath = await fetchDirections(origin, destination, "walking");
  const transitDuration =
    transitPath && transitPath.length > 0
      ? getTotalDurationOfRouteSeconds(transitPath[0])
      : Infinity;
  const walkingDuration =
    walkingPath && walkingPath.length > 0
      ? getTotalDurationOfRouteSeconds(walkingPath[0])
      : Infinity;
  if (transitDuration !== Infinity && transitDuration <= walkingDuration && transitPath)
    return transitPath[0];
  if (walkingDuration !== Infinity && walkingPath) return walkingPath[0];
  return null;
}

function getTotalDurationOfRouteSeconds(route: NormalizedRoute): number {
  return route.legs.reduce((total, leg) => total + leg.duration.value, 0);
}

function parseShuttleTimeToDate(timeStr: string): Date {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const shuttleTime = new Date();
  shuttleTime.setHours(hours, minutes, 0, 0);
  return shuttleTime;
}

/**
  Returns the time in seconds until the next shuttle departure from the specified campus, or null if no shuttle is available within the max wait time. 
  Assumes shuttle transit time between campuses is 30 minutes and takes into account waiting for the shuttle.
*/
async function getShuttleTransitTimeSeconds(
  Campus: Campus,
  now: Date,
  transitDurationToStop: number,
): Promise<number | null> {
  const shuttleSchedule = await getConcordiaShuttleSchedule();
  const campusSchedule = shuttleSchedule.schedule[Campus];
  const maxShuttleWaitTime = 15 * 60;
  if (!shuttleSchedule.isAvailableToday || !campusSchedule) return null;
  const arrivalTimeAtStop = new Date(now.getTime() + transitDurationToStop * 1000);
  const nearestTime = campusSchedule.find((timeStr) => {
    const shuttleTime = parseShuttleTimeToDate(timeStr);
    const waitTime = (shuttleTime.getTime() - arrivalTimeAtStop.getTime()) / 1000;
    return waitTime >= 0 && waitTime <= maxShuttleWaitTime;
  });
  if (!nearestTime) return null;
  const waitTimeSeconds =
    (parseShuttleTimeToDate(nearestTime).getTime() - arrivalTimeAtStop.getTime()) / 1000;
  return waitTimeSeconds + shuttleTransitTime;
}

function coordinateToNormalizedLatLng(coord: Coordinate): NormalizedLatLng {
  return { lat: coord.latitude, lng: coord.longitude };
}

function isDirectPathBetweenCampuses(
  origin: Coordinate,
  destination: Coordinate,
  isOriginLOY: boolean,
): boolean {
  const isOriginSGW = isEqual(origin, SGW_STOP_COORD);
  const isDestinationLOY = isEqual(destination, LOY_STOP_COORD);
  const isDestinationSGW = isEqual(destination, SGW_STOP_COORD);
  return (isOriginLOY && isDestinationSGW) || (isOriginSGW && isDestinationLOY);
}

/* shortcut: origin/destination exactly at the two shuttle stops -> return single shuttle leg */
function handleStopLocationsOnly(
  origin: Coordinate,
  destination: Coordinate,
): NormalizedRoute[] | null {
  const isOriginLOY = isEqual(origin, LOY_STOP_COORD);
  if (isDirectPathBetweenCampuses(origin, destination, isOriginLOY)) {
    const departureCampus = isOriginLOY ? "LOY" : "SGW";
    const arrivalCampus = departureCampus === "LOY" ? "SGW" : "LOY";
    const step = {
      distance: { text: "Inter-campus", value: DISTANCE_BETWEEN_CAMPUSES },
      duration: { text: formatDuration(shuttleTransitTime), value: shuttleTransitTime },
      html_instructions: `Take the Concordia Shuttle from ${departureCampus} to ${arrivalCampus}`,
      maneuver: "",
      polyline: { points: interCampusPolyline },
      travel_mode: "SHUTTLE",
      transit_details: {
        line: { name: "Concordia Shuttle", short_name: "Shuttle", vehicle_type: "BUS" },
        departure_stop: {
          name: departureCampus + " Campus Shuttle Stop",
          location: coordinateToNormalizedLatLng(origin),
        },
        arrival_stop: {
          name: arrivalCampus + " Campus Shuttle Stop",
          location: coordinateToNormalizedLatLng(destination),
        },
      },
    };

    return [
      {
        summary: `Concordia Shuttle (shuttle)`,
        overview_polyline: { points: interCampusPolyline },
        legs: [
          {
            distance: step.distance,
            duration: step.duration,
            steps: [step],
          },
        ],
        totalDurationSeconds: shuttleTransitTime,
      },
    ];
  }
  return null;
}

/**
 * Handles shuttle routing between two coordinates by combining walking/transit segments with the Concordia shuttle service.
 *
 * @param origin - The starting coordinate for the route
 * @param destination - The ending coordinate for the route
 *
 * @returns A promise that resolves to an array of normalized routes using the shuttle service.
 *          Returns an empty array if:
 *          - The shuttle is not available today
 *          - Direct routing between stops is available
 *          - Pre or post-shuttle path cannot be determined
 *          - Shuttle transit time cannot be calculated
 *          - Direct transit is faster than shuttle routing
 *
 * @remarks
 * This function:
 * - Checks shuttle availability for the current day
 * - Determines the closest shuttle stops to both origin and destination
 * - Calculates pre-shuttle (origin to stop) and post-shuttle (stop to destination) paths
 * - Combines these segments with the inter-campus shuttle transit time
 * - Compares against direct transit if available to optimize route selection
 */
async function handleShuttleRouting(
  origin: Coordinate,
  destination: Coordinate,
): Promise<NormalizedRoute[]> {
  const transitStrategy = RouteStrategyFactory.getStrategy("transit");
  const transitRoutes = await transitStrategy.fetch(origin, destination);
  const directTransit = transitRoutes?.[0] ?? null;
  const shuttleSchedule = await getConcordiaShuttleSchedule();
  const now = new Date();
  if (!shuttleSchedule.isAvailableToday) {
    console.log("No shuttle today", now);
    return [];
  }

  const stopRoutes = handleStopLocationsOnly(origin, destination);
  if (stopRoutes) {
    return stopRoutes;
  }

  // info from campuses
  const closestStopToOrigin =
    Math.hypot(
      origin.latitude - LOY_STOP_COORD.latitude,
      origin.longitude - LOY_STOP_COORD.longitude,
    ) <
    Math.hypot(
      origin.latitude - SGW_STOP_COORD.latitude,
      origin.longitude - SGW_STOP_COORD.longitude,
    )
      ? LOY_STOP_COORD
      : SGW_STOP_COORD;
  const closestCampusToOrigin: Campus =
    closestStopToOrigin === LOY_STOP_COORD ? "LOY" : "SGW";
  const closestStopToDestination =
    closestStopToOrigin === LOY_STOP_COORD ? SGW_STOP_COORD : LOY_STOP_COORD;
  const closestCampusToDestination: Campus =
    closestStopToDestination === LOY_STOP_COORD ? "LOY" : "SGW";

  // test if pre-shuttle transit/walking duration + max shuttle wait time is less than direct transit duration. If not, skip shuttle routing.
  const preShuttlePath = await chooseShuttleSegmentPath(origin, closestStopToOrigin);
  if (!preShuttlePath) {
    console.log("no pre shuttle path");
    return [];
  }
  const shuttleTransitTime = await getShuttleTransitTimeSeconds(
    closestCampusToOrigin,
    now,
    preShuttlePath.totalDurationSeconds,
  );
  if (shuttleTransitTime === null) {
    console.log("no shuttle transit time");
    return [];
  }
  // if directTransit route is available, do early check to save time

  if (directTransit !== null) {
    if (
      preShuttlePath.totalDurationSeconds + shuttleTransitTime >=
      directTransit.totalDurationSeconds
    ) {
      console.log("direct transit route is faster than pre + shuttle");
      return [];
    }
  } else {
    console.log("no direct transit route");
  }

  const postShuttlePath = await chooseShuttleSegmentPath(
    closestStopToDestination,
    destination,
  );
  if (!postShuttlePath) {
    console.log("no post shuttle path");
    return [];
  }

  const preShuttleDuration = preShuttlePath.totalDurationSeconds;
  const postShuttleDuration = postShuttlePath.totalDurationSeconds;
  const totalDuration = preShuttleDuration + shuttleTransitTime + postShuttleDuration;

  const totalDistance =
    preShuttlePath.legs.reduce((sum, l) => sum + l.distance.value, 0) +
    DISTANCE_BETWEEN_CAMPUSES +
    postShuttlePath.legs.reduce((sum, l) => sum + l.distance.value, 0);

  const combinedSteps = [
    ...preShuttlePath.legs.flatMap((l) => l.steps),
    {
      distance: { text: "Inter-campus", value: DISTANCE_BETWEEN_CAMPUSES },
      duration: {
        text: formatDuration(shuttleTransitTime),
        value: shuttleTransitTime,
      },
      html_instructions:
        "Take the Concordia Shuttle from " +
        closestCampusToOrigin +
        " to " +
        closestCampusToDestination,
      maneuver: "",
      polyline: { points: interCampusPolyline },
      travel_mode: "SHUTTLE",
      transit_details: {
        line: {
          name: "Concordia Shuttle",
          short_name: "Shuttle",
          vehicle_type: "BUS",
        },
        departure_stop: {
          name: closestCampusToOrigin + " Campus Shuttle Stop",
          location: coordinateToNormalizedLatLng(closestStopToOrigin),
        },
        arrival_stop: {
          name: closestCampusToDestination + " Campus Shuttle Stop",
          location: coordinateToNormalizedLatLng(closestStopToDestination),
        },
      },
    },
    ...postShuttlePath.legs.flatMap((l) => l.steps),
  ];

  const breakdownText = [
    preShuttleDuration > 0 ? `${formatDuration(preShuttleDuration)} walk` : null,
    shuttleTransitTime > 0 ? `${formatDuration(shuttleTransitTime)} shuttle` : null,
    postShuttleDuration > 0 ? `${formatDuration(postShuttleDuration)} walk` : null,
  ]
    .filter(Boolean)
    .join(" + ");

  // Build multimodal route with shuttle segment in the middle.
  return [
    {
      summary: `Concordia Shuttle (${breakdownText})`,
      overview_polyline: {
        points:
          preShuttlePath.overview_polyline.points +
          interCampusPolyline +
          postShuttlePath.overview_polyline.points,
      },
      legs: [
        {
          distance: { text: formatDistance(totalDistance), value: totalDistance },
          duration: { text: formatDuration(totalDuration), value: totalDuration },
          steps: combinedSteps,
        },
      ],
      totalDurationSeconds: totalDuration,
    },
  ];
}

// Strategy Pattern
type GoogleTravelMode = "WALK" | "TRANSIT" | "DRIVE" | "BICYCLE";

interface RouteStrategy {
  fetch(origin: Coordinate, destination: Coordinate): Promise<NormalizedRoute[] | null>;
}

abstract class GoogleRoutesStrategy implements RouteStrategy {
  protected abstract readonly travelMode: GoogleTravelMode;

  protected buildRequestBody(origin: Coordinate, destination: Coordinate) {
    return {
      origin: {
        location: {
          latLng: {
            latitude: origin.latitude,
            longitude: origin.longitude,
          },
        },
      },
      destination: {
        location: {
          latLng: {
            latitude: destination.latitude,
            longitude: destination.longitude,
          },
        },
      },
      travelMode: this.travelMode,
      computeAlternativeRoutes: true,
    };
  }

  async fetch(
    origin: Coordinate,
    destination: Coordinate,
  ): Promise<NormalizedRoute[] | null> {
    const apiKey = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;

    if (!apiKey) {
      console.warn(
        "EXPO_PUBLIC_GOOGLE_API_KEY is not set – directions will not be available.",
      );
      return null;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10_000);

    try {
      const response = await fetch(ROUTES_BASE_URL, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": FIELD_MASK,
        },
        body: JSON.stringify(this.buildRequestBody(origin, destination)),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`Routes API HTTP error: ${response.status}`);
        return null;
      }

      const data: RawRoutesResponse = await response.json();

      if (!data.routes || data.routes.length === 0) {
        return [];
      }

      data.routes = data.routes.filter(
        (route: RawRoute) => route.legs && route.legs.length > 0,
      );

      return data.routes
        .map(normalizeRoute)
        .sort(
          (a: NormalizedRoute, b: NormalizedRoute) =>
            a.totalDurationSeconds - b.totalDurationSeconds,
        );
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        console.warn("fetchDirections timed out after 10 s");
      } else {
        console.error("Failed to fetch directions:", error);
      }

      return null;
    }
  }
}

class WalkingRouteStrategy extends GoogleRoutesStrategy {
  protected readonly travelMode: GoogleTravelMode = "WALK";
}

class TransitRouteStrategy extends GoogleRoutesStrategy {
  protected readonly travelMode: GoogleTravelMode = "TRANSIT";
}

class DrivingRouteStrategy extends GoogleRoutesStrategy {
  protected readonly travelMode: GoogleTravelMode = "DRIVE";
}

class BicyclingRouteStrategy extends GoogleRoutesStrategy {
  protected readonly travelMode: GoogleTravelMode = "BICYCLE";
}

class ShuttleRouteStrategy implements RouteStrategy {
  async fetch(
    _origin: Coordinate,
    _destination: Coordinate,
  ): Promise<NormalizedRoute[] | null> {
    // Shuttle handled separately via Concordia shuttle schedule.
    return await handleShuttleRouting(_origin, _destination);
  }
}

// Strategy Context / Factory
class RouteStrategyFactory {
  private static readonly strategies: Record<TransportationMode, RouteStrategy> = {
    walking: new WalkingRouteStrategy(),
    transit: new TransitRouteStrategy(),
    driving: new DrivingRouteStrategy(),
    bicycling: new BicyclingRouteStrategy(),
    shuttle: new ShuttleRouteStrategy(),
  };

  static getStrategy(mode: TransportationMode): RouteStrategy {
    return this.strategies[mode];
  }
}

// Public API

export async function fetchDirections(
  origin: Coordinate,
  destination: Coordinate,
  mode: TransportationMode,
): Promise<NormalizedRoute[] | null> {
  const strategy = RouteStrategyFactory.getStrategy(mode);
  return strategy.fetch(origin, destination);
}

export async function fetchAllDirections(
  origin: Coordinate,
  destination: Coordinate,
): Promise<Record<TransportationMode, NormalizedRoute[] | null>> {
  const modes: TransportationMode[] = [
    "walking",
    "transit",
    "driving",
    "bicycling",
    "shuttle",
  ];

  const results = await Promise.all(
    modes.map(async (mode) => {
      const routes = await fetchDirections(origin, destination, mode);
      return [mode, routes] as const;
    }),
  );

  return Object.fromEntries(results) as Record<
    TransportationMode,
    NormalizedRoute[] | null
  >;
}

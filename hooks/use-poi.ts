import { Campus, POI } from "@/types/mapTypes";
import { useEffect, useMemo, useState } from "react";
import { SGW_CENTER, LOY_CENTER, MAX_RADIUS_METERS } from "@/constants/campusCenters";
import { Platform } from "react-native";

const SEARCH_TYPES = [
  "restaurant",
  "cafe",
  "library",
  "gym",
  "park",
  "shopping_mall",
  "supermarket",
];

// Cache to store all fetched POIs per campus
const poiCache = new Map<Campus, POI[]>();
const fetchingPromise = new Map<Campus, Promise<POI[]>>();
const isWebRuntime = Platform.OS === "web";
const isBrowserRuntime = typeof window !== "undefined";
let webPlacesApiBlocked = false;
let hasLoggedWebPlacesApiBlocked = false;

function normalizeApiKey(rawApiKey: string | undefined) {
  return (rawApiKey ?? "").trim().replace(/^['"]|['"]$/g, "");
}
function normalizePlacesApiResult(place: any): POI | null {
  const latitude = place?.location?.latitude;
  const longitude = place?.location?.longitude;

  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return null;
  }

  const placeId =
    typeof place?.id === "string" && place.id.length > 0
      ? place.id
      : `${place?.displayName?.text ?? "poi"}-${latitude}-${longitude}`;

  return {
    place_id: placeId,
    name:
      typeof place?.displayName?.text === "string"
        ? place.displayName.text
        : "Unknown POI",
    vicinity:
      typeof place?.formattedAddress === "string" ? place.formattedAddress : undefined,
    rating: typeof place?.rating === "number" ? place.rating : undefined,
    user_ratings_total:
      typeof place?.userRatingCount === "number" ? place.userRatingCount : undefined,
    types: Array.isArray(place?.types)
      ? place.types.filter((type: unknown): type is string => typeof type === "string")
      : [],
    geometry: {
      location: {
        lat: latitude,
        lng: longitude,
      },
      viewport: {
        northeast: {
          lat: latitude,
          lng: longitude,
        },
        southwest: {
          lat: latitude,
          lng: longitude,
        },
      },
    },
  };
}

async function fetchPlacesByTypeWithWebApi(
  region: { latitude: number; longitude: number },
  type: string,
  signal: AbortSignal,
  apiKey: string,
) {
  if (webPlacesApiBlocked) {
    return [];
  }

  const response = await fetch(
    `https://places.googleapis.com/v1/places:searchNearby?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      signal,
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.location,places.types,places.rating,places.userRatingCount",
      },
      body: JSON.stringify({
        includedTypes: [type],
        locationRestriction: {
          circle: {
            center: {
              latitude: region.latitude,
              longitude: region.longitude,
            },
            radius: MAX_RADIUS_METERS,
          },
        },
        maxResultCount: 20,
      }),
    },
  );

  if (!response.ok) {
    const responseText = await response.text().catch(() => "");

    if (response.status === 403) {
      webPlacesApiBlocked = true;
      if (!hasLoggedWebPlacesApiBlocked) {
        console.warn(
          "Places API (New) request was rejected (403). Verify EXPO_PUBLIC_GOOGLE_API_KEY is valid for this app, key restrictions allow this origin, and places.googleapis.com is enabled.",
        );
        hasLoggedWebPlacesApiBlocked = true;
      }
      return [];
    }

    console.error(
      `Failed to fetch ${type} places on web: ${response.status} ${response.statusText} ${responseText}`,
    );
    return [];
  }

  const data = await (response.json() as Promise<{ places?: any[] }>);
  const requestedType = type.toLowerCase();

  return (data.places ?? [])
    .map((result) => normalizePlacesApiResult(result))
    .filter((result): result is POI => result != null)
    .map((result) => {
      const normalizedTypes = new Set(
        (result.types ?? []).map((poiType) => poiType.toLowerCase()),
      );
      normalizedTypes.add(requestedType);

      return {
        ...result,
        types: [...normalizedTypes],
      };
    });
}

/**
 * Calculates distance between two coordinates using the Haversine formula (in meters).
 * Taken from https://www.movable-type.co.uk/scripts/latlong.html
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const EARTH_RADIUS_METERS = 6371000;
  const lat1Rad = (lat1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;
  const deltaLatRad = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLonRad = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(deltaLonRad / 2) *
      Math.sin(deltaLonRad / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

/**
 * Custom hook to fetch Points of Interest (POIs) from the Google Places API once per campus.
 * Caches results and filters by radius on subsequent calls to avoid refetching.
 * @param campus - The campus for which to search for POIs.
 * @param radius - The radius (in meters) around the specified region to search for POIs.
 * @returns An array of POIs within the specified radius.
 */
export function usePoi(campus: Campus, radius: number) {
  const GOOGLE_API_KEY = normalizeApiKey(process.env.EXPO_PUBLIC_GOOGLE_API_KEY);
  // cacheVersion is used to trigger a re-render when the cache is updated
  const [cacheVersion, setCacheVersion] = useState(0);

  const handlePromises = async (requests: Promise<POI[]>[]) => {
    //Promise.allSettled instead of all because in theory don't want to return nothing if one request fails
    const settled = await Promise.allSettled(requests);
    const allResults: POI[] = [];

    settled.forEach((result) => {
      if (result.status === "fulfilled") {
        allResults.push(...result.value);
      }
    });

    const uniquePOI = new Map<string, POI>();
    allResults.forEach((place) => {
      if (place?.place_id) {
        uniquePOI.set(place.place_id, place);
      }
    });

    return [...uniquePOI.values()];
  };

  const dedupePOIs = (places: POI[]) => {
    const uniquePOI = new Map<string, POI>();
    places.forEach((place) => {
      if (place?.place_id) {
        uniquePOI.set(place.place_id, place);
      }
    });

    return [...uniquePOI.values()];
  };

  // Fetch all POIs for a campus
  const fetchAllPOIsForCampus = async (campusToFetch: Campus, signal: AbortSignal) => {
    if (poiCache.has(campusToFetch)) {
      return poiCache.get(campusToFetch);
    }

    // Return existing promise if fetch is in progress
    if (fetchingPromise.has(campusToFetch)) {
      return fetchingPromise.get(campusToFetch);
    }

    const fetchPromise = (async () => {
      try {
        const region = campusToFetch === "SGW" ? SGW_CENTER : LOY_CENTER;
        const shouldUseWebPlacesApi = isWebRuntime || isBrowserRuntime;

        if (shouldUseWebPlacesApi && webPlacesApiBlocked) {
          return [];
        }

        if (!GOOGLE_API_KEY) {
          console.warn("EXPO_PUBLIC_GOOGLE_API_KEY is missing. POIs cannot be fetched.");
          return [];
        }

        let allPOIs: POI[] = [];

        if (shouldUseWebPlacesApi) {
          const collectedPOIs: POI[] = [];

          for (const type of SEARCH_TYPES) {
            if (signal.aborted || webPlacesApiBlocked) {
              break;
            }

            const placesByType = await fetchPlacesByTypeWithWebApi(
              region,
              type,
              signal,
              GOOGLE_API_KEY,
            );
            collectedPOIs.push(...placesByType);
          }

          allPOIs = dedupePOIs(collectedPOIs);
        } else {
          const requests = SEARCH_TYPES.map(async (type) => {
            const url =
              `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
              `?location=${region.latitude},${region.longitude}` +
              `&radius=${MAX_RADIUS_METERS}` +
              `&type=${encodeURIComponent(type)}` +
              `&key=${GOOGLE_API_KEY}`;

            const response = await fetch(url, { signal });
            if (!response.ok) {
              console.error(`${type}: ${response.status} ${response.statusText}`);
            }
            const data = await (response.json() as Promise<{
              results?: POI[];
            }>);
            return data.results ?? [];
          });

          allPOIs = await handlePromises(requests);
        }

        poiCache.set(campusToFetch, allPOIs);
        setCacheVersion((prev) => prev + 1);

        return allPOIs;
      } finally {
        fetchingPromise.delete(campusToFetch);
      }
    })();

    fetchingPromise.set(campusToFetch, fetchPromise);
    return fetchPromise;
  };

  // Filter cached POIs by radius
  const filteredPlaces = useMemo(() => {
    const cached = poiCache.get(campus);
    if (!cached) {
      return [];
    }

    const region = campus === "SGW" ? SGW_CENTER : LOY_CENTER;

    const filtered = cached.filter((poi) => {
      if (!poi.geometry?.location) {
        return false;
      }

      const distance = calculateDistance(
        region.latitude,
        region.longitude,
        poi.geometry.location.lat,
        poi.geometry.location.lng,
      );

      return distance <= radius;
    });

    return filtered;
  }, [campus, radius, cacheVersion]);

  useEffect(() => {
    const controller = new AbortController();

    fetchAllPOIsForCampus(campus, controller.signal);

    return () => controller.abort();
  }, [campus]);

  return filteredPlaces;
}

import { Campus, POI } from "@/types/mapTypes";
import { useEffect, useMemo, useState } from "react";
import { SGW_CENTER, LOY_CENTER, MAX_RADIUS_METERS } from "@/constants/campusCenters";

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

/**
 * Calculates distance between two coordinates using the Haversine formula (in meters).
 * Taken from https://www.movable-type.co.uk/scripts/latlong.html
 */
function calculateDistance(
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
  const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;
  // cacheVersion is used to trigger a re-render when the cache is updated
  const [cacheVersion, setCacheVersion] = useState(0);

  const handlePromises = async (requests: Promise<POI[]>[]) => {
    //Promise.allSettled instead of all because in theory don't want to return nothing if one request fails
    const settled = await Promise.allSettled(requests);
    const allResults: POI[] = [];

    settled.forEach((result) => {
      if (result.status === "fulfilled") {
        allResults.push(...result.value);
      } else {
        console.warn("POI fetch subrequest failed:", result.reason);
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

  // Fetch all POIs for a campus 
  const fetchAllPOIsForCampus = async (campusToFetch: Campus) => {
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

        const requests = SEARCH_TYPES.map(async (type) => {
          const url =
            `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
            `?location=${region.latitude},${region.longitude}` +
            `&radius=${MAX_RADIUS_METERS}` +
            `&type=${encodeURIComponent(type)}` +
            `&key=${GOOGLE_API_KEY}`;

          const response = await fetch(url);
          if (!response.ok) {
            console.error(`${type}: ${response.status} ${response.statusText}`);
          }
          const data = await (response.json() as Promise<{
            results?: POI[];
          }>);
          return data.results ?? [];
        });

        const allPOIs = await handlePromises(requests);
        poiCache.set(campusToFetch, allPOIs);
        setCacheVersion((prev) => prev + 1);

        return allPOIs;
      } 
      finally {
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
    fetchAllPOIsForCampus(campus);
  }, [campus]);

  return filteredPlaces;
}

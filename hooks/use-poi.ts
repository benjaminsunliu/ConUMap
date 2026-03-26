import { Campus, POI } from "@/types/mapTypes";
import { useEffect, useState } from "react";
import { SGW_CENTER, LOY_CENTER } from "@/constants/map";

const SEARCH_TYPES = [
  "restaurant",
  "cafe",
  "library",
  "university",
  "gym",
  "park",
  "shopping_mall",
  "supermarket",
  "transit_station",
];

/**
 * Custom hook to fetch Points of Interest (POIs) from the Google Places API based on a given campus and radius (in meters).
 * @param campus - The campus for which to search for POIs.
 * @param radius - The radius (in meters) around the specified region to search for POIs.
 * @returns An array of POIs that match the search criteria.
 */
export function usePoi(campus: Campus, radius: number) {
  console.log("SGW_CENTER at runtime:", SGW_CENTER);
  const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;
  const [places, setPlaces] = useState<POI[]>([]);

  const handlePromises = async (requests: Promise<any>[]) => {
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
    return uniquePOI;
  };

  useEffect(() => {
    (async () => {
      if (!GOOGLE_API_KEY || !campus) {
        setPlaces([]);
        return;
      }

      const region = campus === "SGW" ? SGW_CENTER : LOY_CENTER;

      const requests = SEARCH_TYPES.map((type) => {
        const url =
          `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
          `?location=${region.latitude},${region.longitude}` +
          `&radius=${radius}` +
          `&type=${encodeURIComponent(type)}` +
          `&key=${GOOGLE_API_KEY}`;

        return fetch(url)
          .then((response) => {
            if (!response.ok) {
              throw new Error(`${type}: ${response.status} ${response.statusText}`);
            }
            return response.json() as Promise<{ results?: POI[] }>;
          })
          .then((data) => data.results ?? []);
      });

      const uniquePOI = await handlePromises(requests);

      const mappedPlaces: POI[] = [...uniquePOI.values()];

      setPlaces(mappedPlaces);
    })();
  }, [GOOGLE_API_KEY, radius, campus]);

  return places;
}

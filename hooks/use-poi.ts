import { POI } from "@/types/mapTypes";
import { useEffect, useState } from "react";
import { Region } from "react-native-maps";

/**
 * Custom hook to fetch Points of Interest (POIs) from the Google Places API based on a given region and radius (in meters).
 * @param region - The geographical region (latitude, longitude, and deltas) to search for POIs.
 * @param radius - The radius (in meters) around the specified region to search for POIs.
 * @returns An array of POIs that match the search criteria.
 */
export function usePoi(region: Region, radius: number) {
  const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;
  const [places, setPlaces] = useState<POI[]>([]);

  useEffect(() => {
    (async () => {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${region.latitude},${region.longitude}&radius=${radius}&type=restaurant&key=${GOOGLE_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      
      const mappedPlaces: POI[] = (data.results ?? []).map((place: any) => 
        ({
        poi_id: place.place_id,
        name: place.name,
        vicinity: place.vicinity,
        rating: place.rating,
        user_ratings_total: place.user_ratings_total,
        types: place.types,
        geometry: {
          location: {
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng,
          },
          viewport: {
            northeast: {
              lat: place.geometry.viewport.northeast.lat,
              lng: place.geometry.viewport.northeast.lng,
            },
            southwest: {
              lat: place.geometry.viewport.southwest.lat,
              lng: place.geometry.viewport.southwest.lng,
            },
          },
        },
        opening_hours: place.opening_hours?.open_now ?? false,
        photos: mapPhotos(place.photos),
      }));

      setPlaces(mappedPlaces);
    })();
  }, [GOOGLE_API_KEY, radius, region.latitude, region.longitude]);

  const mapPhotos = (photos: { photo_reference: string; height: number; width: number; html_attributions: string[] }[]) => {
    return photos?.map((photo) => ({
      photo_reference: photo.photo_reference ,
      height: photo.height,
      width: photo.width,
      html_attributions: photo.html_attributions,
    }));
  };

  return places;
}

import { useEffect, useState } from "react";
import { Region } from "react-native-maps";

export function usePoi(region: Region, radius: number) {
  const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;
  const [places, setPlaces] = useState([]);
  useEffect(() => {
    (async () => {
        const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${region.latitude},${region.longitude}&radius=${radius}&type=restaurant&key=${GOOGLE_API_KEY}`;
        const response= await fetch(url);
        const data = await response.json();
        setPlaces(data.results);
        console.log(places);
    })();
  }, [places]);

  return places;
}



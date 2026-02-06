import { Coordinate } from "@/types/mapTypes";


// Using Haversine formula to calculate distance between two coordinates (For us, it is between user and Concordia building coordinates)
export function calculateDistance(coord1: Coordinate, coord2: Coordinate): number {
  const R = 6371200; // Earth radius in meters
  const dLat = toRad(coord2.latitude - coord1.latitude);
  const dLon = toRad(coord2.longitude - coord1.longitude);
  const lat1 = toRad(coord1.latitude);
  const lat2 = toRad(coord2.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return  R * c; // Distance in meters
  
}

// Degrees to Radians
function toRad(value: number): number {
  return (value * Math.PI) / 180;
}


// Find the closest building to a given coordinate
export function findClosestBuilding(
  userLocation: Coordinate,
  buildings: { location: Coordinate; code: string }[]
): string | null {
  if (buildings.length === 0) return null;

  // Store the closest building found
  let closestBuilding = buildings[0];
  let closestDistance = calculateDistance(userLocation, buildings[0].location);

  // Check all buildings to find the closest one
  for (let i = 1; i < buildings.length; i++) {
    const distance = calculateDistance(userLocation, buildings[i].location);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestBuilding = buildings[i];
    }
  }

  return closestBuilding.code;
}

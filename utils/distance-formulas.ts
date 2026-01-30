export const getDistanceKm = (
    latitude1: number,
    longitude1: number,
    latitude2: number,
    longitude2: number
  ) => {
    const toRad = (v: number) => (v * Math.PI) / 180;
    const EarthRadius = 6371; //in km
    const dLat = toRad(latitude2 - latitude1);
    const dLon = toRad(longitude2 - longitude1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(latitude1)) * Math.cos(toRad(latitude2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return EarthRadius * c;
  };
  
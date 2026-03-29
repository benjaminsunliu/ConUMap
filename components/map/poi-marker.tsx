import { POI } from "@/types/mapTypes";
import { PoiMarkerColors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, View } from "react-native";
import { Marker } from "react-native-maps";

type PoiMarkerVisual = {
  icon: keyof typeof Ionicons.glyphMap;
  backgroundColor: string;
};

interface PoiMarkerProps {
  readonly poi: POI;
  readonly onPress?: () => void;
}

function getPoiMarkerVisual(types: string[]): PoiMarkerVisual {
  //Some POIs have multiple types, order is arbitrary
  const typeSet = new Set(types.map((type) => type.toLowerCase()));

  if (typeSet.has("restaurant")) {
    return { icon: "restaurant", backgroundColor: PoiMarkerColors.restaurant };
  }
  if (typeSet.has("cafe")) {
    return { icon: "cafe", backgroundColor: PoiMarkerColors.cafe };
  }
  if (typeSet.has("library")) {
    return { icon: "library", backgroundColor: PoiMarkerColors.library };
  }
  if (typeSet.has("park")) {
    return { icon: "leaf", backgroundColor: PoiMarkerColors.park };
  }
  if (typeSet.has("shopping_mall") || typeSet.has("store")) {
    return { icon: "bag-handle", backgroundColor: PoiMarkerColors.shopping };
  }
  if (typeSet.has("supermarket")) {
    return { icon: "cart", backgroundColor: PoiMarkerColors.supermarket };
  }
  if (typeSet.has("lodging")) {
    return { icon: "bed", backgroundColor: PoiMarkerColors.lodging };
  }
  if (typeSet.has("gym")) {
    return { icon: "barbell", backgroundColor: PoiMarkerColors.gym };
  }

  return { icon: "location", backgroundColor: PoiMarkerColors.default };
}

export default function PoiMarker({ poi, onPress }: Readonly<PoiMarkerProps>) {
  const markerVisual = getPoiMarkerVisual(poi.types);

  return (
    <Marker
      coordinate={{
        latitude: poi.geometry.location.lat,
        longitude: poi.geometry.location.lng,
      }}
      onPress={onPress}
    >
      <View
        testID="poi-marker-body"
        style={[styles.poiMarker, { backgroundColor: markerVisual.backgroundColor }]}
      >
        <Ionicons name={markerVisual.icon} size={15} color={PoiMarkerColors.icon} />
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  poiMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderColor: PoiMarkerColors.border,
    borderWidth: 2,
    shadowColor: PoiMarkerColors.shadow,
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
});

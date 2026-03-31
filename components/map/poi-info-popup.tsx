import { POI } from "@/types/mapTypes";
import { Text, View } from "react-native";
interface Props {
  poi: POI;
  onNavigate: () => void;
}

export function POIInfoPopup({ poi, onNavigate }: Props) {
  return (
    <View>
      <Text>{poi.name}</Text>
      <Text>{poi.vicinity}</Text>
    </View>
  );
}

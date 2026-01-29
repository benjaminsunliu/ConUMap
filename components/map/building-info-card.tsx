import { StyleSheet, Text, View } from "react-native";
import { Building } from "../../data/building-info-data";

interface Props {
  building: Building | null;
}

export default function BuildingInfoCard({ building }: Props) {
  if (!building) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{building.name} - {building.campus}</Text>
      <Text>{building.description}</Text>
      <View style={styles.rule}/>
      <Text style={styles.line}>Hours: {building.openingHours} </Text>
      <Text style={styles.line}>Contact: {building.contactInfo} </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: "absolute",
    bottom: 110,
    left: 20,
    right: 20,
    backgroundColor: "white",
    padding: 14,
    borderRadius: 12,
    elevation: 5,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  line: {
    marginTop: 4,
  },
  rule: {
    borderBottomColor: 'black', 
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginTop: 8,
    marginBottom: 4, 
  }
});

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  Modal,
  Pressable,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";

interface Props {
  visible: boolean;
  onRequestClose: () => void;
}

export default function LocationModal({ visible, onRequestClose }: Props) {
  return (
    <Modal
      onRequestClose={onRequestClose}
      animationType="fade"
      visible={visible}
      transparent={true}
    >
      <TouchableWithoutFeedback onPress={onRequestClose}>
        <View style={{ width: "100%", height: "100%" }}>
          <ThemedView style={styles.container}>
            <ThemedText style={styles.text}>
              Please turn on your location settings
            </ThemedText>
            <Pressable style={styles.button} onPress={onRequestClose}>
              <ThemedText type="subtitle" style={styles.button}>
                Okay
              </ThemedText>
            </Pressable>
          </ThemedView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    width: "80%",
    maxWidth: 300,
    maxHeight: 200,
    borderRadius: 30,
    margin: "auto",
    padding: 20,
  },
  text: {
    marginTop: 15,
    paddingVertical: 15,
  },
  button: {
    padding: 10,
    alignItems: "center",
  },
});

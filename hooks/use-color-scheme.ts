import {
  Platform,
  useColorScheme as usePossibleScheme,
  ColorSchemeName as possibleColorSchemeName,
} from "react-native";

export type ColorSchemeName = Exclude<possibleColorSchemeName, null | undefined>;

export function useColorScheme() {
  // Keep web UI fixed to light mode regardless of system preference.
  if (Platform.OS === "web") {
    return "light";
  }

  return usePossibleScheme() ?? "light";
}

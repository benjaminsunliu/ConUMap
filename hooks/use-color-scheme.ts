import {
  useColorScheme as usePossibleScheme,
  ColorSchemeName as possibleColorSchemeName,
} from "react-native";

export type ColorSchemeName = Exclude<possibleColorSchemeName, null | undefined>;

export function useColorScheme() {
  return usePossibleScheme() ?? "light";
}

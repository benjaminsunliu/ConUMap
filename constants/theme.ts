import RoutesInfoPopup from "@/components/navigation/routes-info-popup";
import { Platform } from "react-native";

const white = "#ffffff";
const black = "#000000"
const tintColorLight = "#5e0e16";
const tintColorDark = white;

export const Colors = {
  light: {
    text: "#11181C",
    background: "#fbf6ec",
    tint: tintColorLight,
    icon: "#5e0e16",
    tabIconDefault: "#11181C",
    tabIconSelected: tintColorLight,

    map: {
      polygonFill: "#a0686d",
      polygonHighlighted: "#701922",
      currentBuildingColor: "#484949",
      currentSelectedBuildingColor: black,
      polygonStroke: black,
      marker: "#200003",
      markerSelected: white,
      markerText: white,
      markerTextSelected: "#200003",
      markerBorder: white,
      markerBorderSelected: "#200003",
      clusterMarker: "#200003",
      clusterText: white,
    },

    buildingInfoPopup: {
      background: white,
      handle: "#cccccc",
      title: "#11181C",
      text: "#333333",
      divider: "#dddddd",

      openStatus: "#1e8e3e",
      accessibilityIcon: "#1e8e3e",

      actionButtonBackground: "#e8f0fe",
      actionButtonText: "#1a73e8",
      actionButtonIcon: "#1a73e8",
    },

    routesInfoPopup: {
      icon: black,
      selectedIcon: black
    },

    campusToggle: {
      textColor: white,
      selectedColor: black,
      buttonColor: white,
      borderColor: black,
      backgroundColor: black
    },

    buildingSelection: {
      inputBackground: white,
      inputText: black,
      magnifierColor: "#3c050a",
      borderColor: black,
      clearButton: black,
      containerBackground: "#fbf6ec",
      swapButton: black
    }
  },

  dark: {
    text: "#b28e8b",
    background: "#5e0e16",
    tint: tintColorDark,
    icon: white,
    tabIconDefault: white,
    tabIconSelected: tintColorDark,

    map: {
      polygonFill: "#a0686d",
      polygonHighlighted: "#701922",
      currentBuildingColor: "#484949",
      currentSelectedBuildingColor: black,
      polygonStroke: black,
      marker: "#330703",
      markerSelected: white,
      markerText: white,
      markerTextSelected: "#330703",
      markerBorder: white,
      markerBorderSelected: "#330703",
      clusterMarker: "#330703",
      clusterText: white,
    },

    buildingInfoPopup: {
      background: "#330300",
      handle: "#A0676D",
      title: white,
      text: white,
      divider: "#dddddd",

      openStatus: "#02C39A",
      accessibilityIcon: "#02C39A",

      actionButtonBackground: "#C2E8F6",
      actionButtonText: "#1a73e8",
      actionButtonIcon: "#1a73e8",
    },

    routesInfoPopup: {
      icon: white,
      selectedIcon: white
    },

    campusToggle: {
      textColor: white,
      selectedColor: black,
      buttonColor: white,
      borderColor: black,
      backgroundColor: black
    },
    buildingSelection: {
      inputBackground: white,
      inputText: "#000",
      magnifierColor: "#420A0F",
      borderColor: "#252424",
      clearButton: "#420A0F",
      containerBackground: "#420A0F",
      swapButton: white
    }
  }
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

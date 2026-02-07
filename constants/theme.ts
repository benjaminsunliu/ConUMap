import { Platform } from "react-native";

const tintColorLight = "#5e0e16";
const tintColorDark = "#ffffff";

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
      closestBuildingColor: "#1e8e3e",
      closestSelectedBuildingColor: "#006943",
      polygonStroke: "black",
      marker: "#200003",
      markerSelected: "#fff",
      markerText: "#fff",
      markerTextSelected: "#200003",
      markerBorder: "#fff",
      markerBorderSelected: "#200003",
      clusterMarker: "#200003",
      clusterText: "#fff",
    },

    buildingInfoPopup: {
      background: "#ffffff",
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

    campusToggle: {
      textColor: "#FFFFFF",
      selectedColor: "#000000",
      buttonColor: "#fbf6ec",
      borderColor: "#420A0F",
      backgroundColor: "#420A0F"
    }
  },

  dark: {
    text: "#b28e8b",
    background: "#5e0e16",
    tint: tintColorDark,
    icon: "#ffffff",
    tabIconDefault: "#ffffff",
    tabIconSelected: tintColorDark,

    map: {
      polygonFill: "#a0686d",
      polygonHighlighted: "#701922",
      closestBuildingColor: "#1e8e3e",
      closestSelectedBuildingColor: "#006943",
      polygonStroke: "black",
      marker: "#330703",
      markerSelected: "#fff",
      markerText: "#fff",
      markerTextSelected: "#330703",
      markerBorder: "#fff",
      markerBorderSelected: "#330703",
      clusterMarker: "#330703",
      clusterText: "#fff",
    },

    buildingInfoPopup: {
      background: "#ffffff",
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

    campusToggle: {
      textColor: "#FFFFFF",
      selectedColor: "#FFFFFF",
      buttonColor: "#a0686d",
      borderColor: "#420A0F",
      backgroundColor: "#420A0F"
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

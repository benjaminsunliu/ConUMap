// Mock @expo/vector-icons/MaterialIcons to avoid font loading
jest.mock("@expo/vector-icons/MaterialIcons", () => {
  return function MaterialIcons() {
    return null;
  };
});
jest.mock("@expo/vector-icons", () => {
  return {
    Ionicons: (props) => null, //
  };
});
jest.mock("expo-router", () => ({
  useLocalSearchParams: jest.fn(() => ({})),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  })),
  usePathname: jest.fn(() => "/"),
}));
process.env.EXPO_PUBLIC_GOOGLE_API_KEY = 'test-key';

jest.mock("@/data/indoorMapData/jsonGraphs/CC_floor_plan.json.txt", () => ({}));
jest.mock("@/data/indoorMapData/jsonGraphs/H_floor_plan.json.txt", () => ({}));
jest.mock("@/data/indoorMapData/jsonGraphs/LB_floor_plan.json.txt", () => ({}));
jest.mock("@/data/indoorMapData/jsonGraphs/MB_floor_plan.json.txt", () => ({}));
jest.mock("@/data/indoorMapData/jsonGraphs/VE_floor_plan.json.txt", () => ({}));
jest.mock("@/data/indoorMapData/jsonGraphs/VL_floor_plan.json.txt", () => ({}));

jest.mock("expo-asset", () => ({
  Asset: class MockedAsset {
    static loadAsync() {
      return new Promise((r) => {
        r([
          {
            localUri: "file://fakePath.txt",
          },
        ]);
      });
    }
  },
}));
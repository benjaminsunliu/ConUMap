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
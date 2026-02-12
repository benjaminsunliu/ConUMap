
// Mock @expo/vector-icons/MaterialIcons to avoid font loading
jest.mock('@expo/vector-icons/MaterialIcons', () => {
    return function MaterialIcons() {
      return null; 
    };
  });
  jest.mock('@expo/vector-icons', () => {
    return {
      Ionicons: (props) => null,//
    };
  });
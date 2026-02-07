
// Mock @expo/vector-icons/MaterialIcons to avoid font loading
jest.mock('@expo/vector-icons/MaterialIcons', () => {
    const React = require('react');  
    return function MaterialIcons(props) {
      return React.createElement('View', props);  // Simple View component
    };
  });
  jest.mock('@expo/vector-icons', () => {
    return {
      Ionicons: (props) => null,
    };
  });
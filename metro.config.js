const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push(
  'txt' // allows use to bundle text files in the app
);

module.exports = config;

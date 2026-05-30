const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'util/support/types': path.resolve(__dirname, 'node_modules/util/support/types.js'),
};

module.exports = config;

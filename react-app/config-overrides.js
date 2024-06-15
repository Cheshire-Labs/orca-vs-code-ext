const path = require('path');

module.exports = function override(config, env) {

  // Disables code splitting into chunks
  config.optimization.splitChunks = {
    cacheGroups: {
      default: false,
    },
  };
  config.optimization.runtimeChunk = false;

  // Set the publicPath to be a vscode-resource URI
  config.output.publicPath = 'https://file%2B.vscode-resource.vscode-cdn.net/' + path.resolve(__dirname, 'build').replace(/\\/g, '/') + '/';
  return config;
};
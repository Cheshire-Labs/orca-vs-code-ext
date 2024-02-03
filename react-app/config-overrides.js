const path = require('path');

module.exports = function override(config, env) {
  config.output.publicPath = 'vscode-resource:' + path.resolve(__dirname, 'build').replace(/\\/g, '/') + '/';

  return config;
};
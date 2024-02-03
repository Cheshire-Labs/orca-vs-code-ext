const path = require('path');
const { merge } = require('webpack-merge');
const common = require('react-scripts/config/webpack.config');

module.exports = merge(common('production'), {
  output: {
    publicPath: 'https://file%2B.vscode-resource.vscode-cdn.net/' + path.resolve(__dirname, 'build').replace(/\\/g, '/') + '/',
  },
});
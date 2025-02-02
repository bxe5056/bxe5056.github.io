const webpack = require("webpack");

module.exports = function override(config, env) {
  // Add fallbacks for node core modules
  config.resolve.fallback = {
    ...config.resolve.fallback,
    os: require.resolve("os-browserify/browser"),
    fs: false,
    path: require.resolve("path-browserify"),
    url: require.resolve("url/"),
  };

  // Add buffer polyfill
  config.plugins = [
    ...config.plugins,
    new webpack.ProvidePlugin({
      Buffer: ["buffer", "Buffer"],
    }),
  ];

  return config;
};

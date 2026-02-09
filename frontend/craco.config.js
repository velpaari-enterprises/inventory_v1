module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Ignore source-map-loader warnings from html5-qrcode
      webpackConfig.ignoreWarnings = [
        {
          module: /node_modules\/html5-qrcode/,
          message: /Failed to parse source map/,
        },
      ];
      return webpackConfig;
    },
  },
};

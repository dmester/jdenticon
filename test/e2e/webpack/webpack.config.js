const path = require("path");

module.exports = {
    mode: "production",
    entry: path.join(__dirname, "app.js"),
    externals: {
      "tap": "commonjs tap", 
      "canvas-renderer": "commonjs canvas-renderer"
    },
    module: {
      rules: [
        {
          test: /\.mjs$/,
          enforce: 'pre',
          use: ['source-map-loader'],
        },
        {
          test: /\.js$/,
          enforce: 'pre',
          use: ['source-map-loader'],
        },
      ],
    },
    stats: {
      warningsFilter: [/Failed to parse source map/],
    },
    devtool: "source-map",
    
    output: {
      path: __dirname,
      filename: "app.bundle.js",
    },
}

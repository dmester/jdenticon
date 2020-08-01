const path = require("path");

module.exports = {
    mode: "production",
    entry: path.join(__dirname, "app.js"),
    externals: {
      "tap": "commonjs tap", 
      "canvas-renderer": "commonjs canvas-renderer"
    },
    output: {
      path: __dirname,
      filename: "app.bundle.js",
    },
}

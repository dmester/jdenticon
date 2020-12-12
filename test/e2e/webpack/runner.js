const process = require("process");
const config = require("./webpack.config");
const moduleAlias = require("module-alias");
const webpackPackageName = process.argv[2];

// This file is used instead of webpack-cli to allow testing with multiple webpack versions

if (!webpackPackageName) {
    console.error("Usage: node runner.js (webpack4|webpack5)");
    process.exit(1);
}

if (!/^webpack\d+$/.test(webpackPackageName)) {
    console.error("Invalid webpack package name specified");
    process.exit(2);
}

// The terser plugin in webpack4 imports "webpack/lib/RequestShortener", so we can't require the right webpack module
// name and use it straight away. By using module-alias we make "webpack" requirable.
moduleAlias.addAlias("webpack", webpackPackageName);

const webpack = require("webpack");

webpack(config, (err, stats) => {
    if (err) {
        console.error(err);
        process.exit(3);
        return;
    }

    console.log(stats.toString({
        colors: true
    }));

    console.log("---");

    if (stats.hasErrors()) {
        process.exit(4);
    }
});
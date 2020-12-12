/**
 * Jdenticon
 * https://github.com/dmester/jdenticon
 * Copyright © Daniel Mester Pirttijärvi
 */
"use strict";

const del = require("del");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { exec } = require("child_process");
const { promisify } = require("util");
const pack = require("./package.json");

// Gulp dependencies
const gulp = require("gulp");
const rename = require("gulp-rename");
const terser = require("gulp-terser");
const zip = require("gulp-zip");
const replace = require("./build/gulp/replacement").gulp;
const wrapTemplate = require("./build/gulp/wrap-template");
const buble = require("gulp-buble");
const sourcemaps = require("gulp-sourcemaps");
const preMinify = require("./build/gulp/pre-minify");
const removeJsDocImports = require("./build/gulp/remove-jsdoc-imports");
const removeMappedSource = require("./build/gulp/remove-mapped-source");

// Rollup dependencies
const rollup = require("./build/gulp/rollup");
const commonjs = require( "@rollup/plugin-commonjs");
const stripBanner = require("rollup-plugin-strip-banner");
const alias = require("@rollup/plugin-alias");

// Constants
const LICENSE = fs.readFileSync("./LICENSE").toString();
const VARIABLES = [
    [/#version#/g, pack.version],
    [/#year#/g, new Date().getFullYear()],
    [/#date#/g, new Date().toISOString()],

    // Keep line prefix, e.g. " * " for license banners in JavaScript.
    [/(.*)#license#/gm, "$1" + LICENSE.trim().replace(/\n/g, "\n$1")],
];

function umdSrc() {
    return gulp.src("./src/browser-umd.js")
        .pipe(sourcemaps.init())    
        .pipe(rollup({
            output: { format: "cjs" },
            plugins: [
                stripBanner(), 
                alias({
                    entries: [
                        { find: /^(.*[\/\\])global$/, replacement: "$1global.umd" },
                    ]
                }),
            ],
        }))

        .pipe(rename(function (path) { path.basename = "notmapped"; path.extname = ".js" }))

        .pipe(buble())
        .pipe(preMinify())
        .pipe(removeJsDocImports())

        // The UMD template expects a factory function body, so replace export with a return for the factory function.
        .pipe(replace("module.exports = ", "return "))

        .pipe(replace(VARIABLES))
        .pipe(wrapTemplate("./build/template-umd.js", VARIABLES));
}

gulp.task("clean", function () {
    return del(["./~jdenticon.nuspec", "./obj/output"]);
});

gulp.task("build-umd", function () {
    return umdSrc()
        .pipe(rename(function (path) { path.basename = "jdenticon"; path.extname = ".js" }))
        .pipe(gulp.dest("dist"))
        
        .pipe(rename(function (path) { path.basename = "jdenticon-" + pack.version; path.extname = ".js" }))
        .pipe(gulp.dest("obj/output"));
});

gulp.task("build-umd-min", function () {
    return umdSrc()
        .pipe(terser())
        .pipe(wrapTemplate("./build/template-min.js", VARIABLES))

        .pipe(removeMappedSource("notmapped.js"))

        .pipe(rename(function (path) { path.basename = "jdenticon"; path.extname = ".min.js" }))
        .pipe(sourcemaps.write(".", { includeContent: true }))
        .pipe(gulp.dest("dist"))
        
        .pipe(rename(function (path) { path.basename = "jdenticon-" + pack.version; path.extname = ".min.js" }))
        .pipe(sourcemaps.write(".", { includeContent: true }))
        .pipe(gulp.dest("obj/output"));
});

gulp.task("build-cjs", function () {
    return gulp.src("./src/browser-cjs.js")
        .pipe(sourcemaps.init())
        .pipe(rollup({
            output: { format: "cjs" },
            plugins: [ stripBanner() ],
        }))

        .pipe(rename(function (path) { path.basename = "notmapped"; path.extname = ".js" }))
        .pipe(buble())
        .pipe(preMinify())
        .pipe(removeJsDocImports())

        // Replace variables
        .pipe(replace(VARIABLES))
        .pipe(wrapTemplate("./build/template-module.js", VARIABLES))

        .pipe(removeMappedSource("notmapped.js"))
        
        .pipe(rename(function (path) { path.basename = "jdenticon-module"; path.extname = ".js" }))
        .pipe(replace(/[\r\n]*$/, "\n//# sourceMappingURL=jdenticon-module.js.map\n"))
        .pipe(sourcemaps.write("./", { includeContent: true, addComment: false }))
        .pipe(gulp.dest("dist"))
        
        .pipe(rename(function (path) { path.basename = "jdenticon-module-" + pack.version; path.extname = ".js" }))
        .pipe(gulp.dest("obj/output"))
});

gulp.task("build-esm", function () {
    return gulp.src("./src/browser-esm.js")
        .pipe(sourcemaps.init())
        .pipe(rollup({
            output: { format: "esm" },
            plugins: [ stripBanner() ],
        }))

        .pipe(preMinify())
        .pipe(removeJsDocImports())

        // Replace variables
        .pipe(replace(VARIABLES))
        .pipe(wrapTemplate("./build/template-module.js", VARIABLES))

        .pipe(rename(function (path) { path.basename = "jdenticon-module"; path.extname = ".mjs" }))
        .pipe(replace(/[\r\n]*$/, "\n//# sourceMappingURL=jdenticon-module.mjs.map\n"))
        .pipe(sourcemaps.write("./", { includeContent: true, addComment: false }))
        .pipe(gulp.dest("dist"))
        
        .pipe(rename(function (path) { path.basename = "jdenticon-module-" + pack.version; path.extname = ".mjs" }))
        .pipe(gulp.dest("obj/output"))
});

gulp.task("build-node-cjs", function () {
    return gulp.src("./src/node-cjs.js")
        .pipe(sourcemaps.init())
        .pipe(rollup({
            external: [ "canvas-renderer" ],
            plugins: [ stripBanner(), commonjs() ],
            output: { format: "cjs" },
        }))
        
        .pipe(removeJsDocImports())

        .pipe(replace(VARIABLES))
        .pipe(wrapTemplate("./build/template-module.js", VARIABLES))

        .pipe(rename(path => { path.basename = "jdenticon-node"; path.extname = ".js" }))
        .pipe(replace(/[\r\n]*$/, "\n//# sourceMappingURL=jdenticon-node.js.map\n"))
        .pipe(sourcemaps.write("./", { includeContent: true, addComment: false }))
        .pipe(gulp.dest("./dist"))
        
        .pipe(rename(function (path) { path.basename = "jdenticon-node-" + pack.version; path.extname = ".js" }))
        .pipe(gulp.dest("./obj/output"));
});

gulp.task("build-node-esm", function () {
    return gulp.src("./src/node-esm.js")
        .pipe(sourcemaps.init())
        .pipe(rollup({
            external: [ "canvas-renderer" ],
            plugins: [ stripBanner(), commonjs() ],
            output: { format: "esm" },
        }))

        .pipe(removeJsDocImports())

        .pipe(replace(VARIABLES))
        .pipe(wrapTemplate("./build/template-module.js", VARIABLES))

        .pipe(rename(path => { path.basename = "jdenticon-node"; path.extname = ".mjs" }))
        .pipe(replace(/[\r\n]*$/, "\n//# sourceMappingURL=jdenticon-node.mjs.map\n"))
        .pipe(sourcemaps.write("./", { includeContent: true, addComment: false }))

        .pipe(gulp.dest("./dist"))
        
        .pipe(rename(function (path) { path.basename = "jdenticon-node-" + pack.version; path.extname = ".mjs" }))
        .pipe(gulp.dest("./obj/output"));
});

gulp.task("update-license-year", function () {
    return gulp.src("./LICENSE")
        .pipe(replace(/\(c\) 2014-\d+/, "(c) 2014-" + new Date().getFullYear()))
        .pipe(gulp.dest("./"))
});

gulp.task("update-readme", function () {
    return gulp.src("./README.md")
        .pipe(replace([
            [/@\d{1,2}\.\d{1,3}\.\d{1,3}/, "@" + pack.version],
            [/(?<=integrity=\"([^-]+)-).*?(?=\")/, (match, algorithm) => {
                const min = fs.readFileSync("./dist/jdenticon.min.js");
                return crypto.createHash(algorithm).update(min).digest("base64");
            }],
        ]))
        .pipe(gulp.dest("./"))
});

gulp.task("install-jdenticon-test", function () {
    const globs = pack.files
        .map(file => {
            const isDirectory = 
                !/\*/.test(file) && 
                fs.existsSync(file) &&
                fs.lstatSync(file).isDirectory();
            return isDirectory ? path.join(file, "**") : file;
        });
    
    // Simulate an installed Jdenticon package. Cannot use actual npm command, since it won't install Jdenticon in a
    // subfolder to the Jdenticon source package itself.
    return gulp.src(["./package.json", ...globs], { base: "./" })
        .pipe(gulp.dest("./test/e2e/node_modules/jdenticon"));
});

gulp.task("build", gulp.series("clean", gulp.parallel(
    "build-umd", "build-umd-min",
    "build-esm", "build-cjs",
    "build-node-cjs", "build-node-esm",
), "install-jdenticon-test"));
 
gulp.task("clean-tests", function () {
    return del(["./obj/test/unit/**"]);
});

gulp.task("build-unit-tests-js", function () {
    return gulp.src("./test/unit/*.js", { base: "./" })
        .pipe(sourcemaps.init())
        .pipe(rollup({
            external: [ "canvas-renderer", "fs", "tap" ],
            plugins: [ commonjs() ],
            output: { format: "cjs" },
        }))
        .pipe(sourcemaps.write("./"))
        .pipe(gulp.dest("./obj"))
});

gulp.task("build-unit-tests", gulp.series("clean-tests", "build-unit-tests-js"));

gulp.task("prepare-release", function () {
    return gulp.src(["./LICENSE", "./README.md"])
        .pipe(replace(VARIABLES))
        .pipe(rename(function (path) { path.extname = ".txt" }))
        .pipe(gulp.dest("obj/output"));
});

gulp.task("prepare-nuget", function () {
    return gulp.src(["./build/jdenticon.nuspec"])
        .pipe(replace(VARIABLES))
        .pipe(rename(function (path) { path.basename = "~" + path.basename }))
        .pipe(gulp.dest("./"));
});

gulp.task("nuget", async function () {
    var command = "\"./build/nuget/nuget.exe\" pack ~jdenticon.nuspec -OutputDirectory releases";

    if (process.platform !== "win32") {
        command = "mono " + command;
    }

    await promisify(exec)(command);

    await del(["./~jdenticon.nuspec"]);
});

gulp.task("create-package", function () {
    return gulp.src(["./obj/output/*"])
        .pipe(zip("jdenticon-" + pack.version + ".zip"))
        .pipe(gulp.dest("releases"));
});

gulp.task("release", gulp.series(
    "build",
    "update-license-year", "update-readme",
    "prepare-release",
    "create-package",
    "prepare-nuget", "nuget",
));

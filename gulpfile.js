/**
 * Jdenticon
 * https://github.com/dmester/jdenticon
 * Copyright © Daniel Mester Pirttijärvi
 */
"use strict";

const del = require("del");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const pack = require("./package.json");

// Gulp dependencies
const gulp = require("gulp");
const rename = require("gulp-rename");
const closure = require("google-closure-compiler").gulp();
const zip = require("gulp-zip");
const replace = require("./build/replacement").gulp;
const buble = require("gulp-buble");
const sourcemaps = require("gulp-sourcemaps");
const mangleProps = require("./build/mangle-props");

// Rollup dependencies
const rollup = require("./build/rollup-stream");
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

function getWrapper(source, placeholder) {
    return VARIABLES.reduce(
        (result, variable) => result.replace(...variable),
        fs.readFileSync(source)
            .toString()
            .replace(/\/\*content\*\//, placeholder));
}

function wrapTemplate(templatePath) {
    const template = fs.readFileSync(templatePath)
        .toString()
        .split(/\/\*content\*\//);

    const replacements = [];
    if (template[0]) {
        replacements.push([/^/, template[0]]);
    }
    if (template[1]) {
        replacements.push([/$/, template[1]]);
    }

    return replace(replacements);
}

function umdSrc() {
    return gulp.src("./src/browser-umd.js")
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

        // The UMD template expects a factory function body, so replace export with a return for the factory function.
        .pipe(replace("module.exports = ", "return "))

        .pipe(wrapTemplate("./build/template-umd.js"))
        .pipe(replace(VARIABLES));
}

gulp.task("clean", function (cb) {
    del(["./~jdenticon.nuspec", "./obj/output"], cb);
});

gulp.task("build-umd", function () {
    return umdSrc()
        .pipe(buble())
        
        .pipe(rename(function (path) { path.basename = "jdenticon"; path.extname = ".js" }))
        .pipe(sourcemaps.write("."))
        .pipe(gulp.dest("dist"))
        
        .pipe(rename(function (path) { path.basename = "jdenticon-" + pack.version; path.extname = ".js" }))
        .pipe(gulp.dest("obj/output"));
});

gulp.task("build-umd-min", function () {
    return umdSrc()
        
        // Buble not needed since Closure Compiler will do the same

        // Prepare for minification
        .pipe(rename(function (path) { path.basename = "jdenticon"; path.extname = ".js" }))
        .pipe(sourcemaps.init())
        
        // Closure does not know that ELEMENT_NODE is a constant. Replace it before passing it on to Closure.
        .pipe(replace("Node.ELEMENT_NODE", "1"))
        
        // Minified file
        .pipe(closure({
            compilation_level: "ADVANCED",
            rewritePolyfills: false,
            createSourceMap: true,
            sourceMapIncludeContent: true,
            outputWrapper: getWrapper("./build/template-min.js", "%output%"),
            externs: [
                { src: "var module; function define(deps, cb) { }" }
            ]
        }, {
            platform: ["javascript"]
        }))

        .pipe(rename(function (path) { path.basename = "jdenticon"; path.extname = ".min.js" }))
        .pipe(sourcemaps.write("."))
        .pipe(gulp.dest("dist"))
        
        .pipe(rename(function (path) { path.basename = "jdenticon-" + pack.version; path.extname = ".min.js" }))
        .pipe(sourcemaps.write("."))
        .pipe(gulp.dest("obj/output"));
});

gulp.task("build-cjs", function () {
    return gulp.src("./src/browser-cjs.js")
        .pipe(sourcemaps.init())
        .pipe(rollup({
            output: { format: "cjs" },
            plugins: [ stripBanner() ],
        }))

        .pipe(rename(function (path) { path.basename = "jdenticon-module"; path.extname = ".js" }))
        .pipe(buble())

        // Replace variables
        .pipe(wrapTemplate("./build/template-module.js"))
        .pipe(replace(VARIABLES))
        
        .pipe(mangleProps())

        .pipe(sourcemaps.write("./", { includeContent: true }))
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

        .pipe(rename(function (path) { path.basename = "jdenticon-module"; path.extname = ".mjs" }))

        // Replace variables
        .pipe(wrapTemplate("./build/template-module.js"))
        .pipe(replace(VARIABLES))

        .pipe(mangleProps())

        .pipe(sourcemaps.write("./", { includeContent: true }))
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
        
        .pipe(wrapTemplate("./build/template-module.js"))
        .pipe(replace(VARIABLES))

        .pipe(rename(path => { path.basename = "jdenticon-node"; path.extname = ".js" }))

        .pipe(sourcemaps.write("./"))
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

        .pipe(wrapTemplate("./build/template-module.js"))
        .pipe(replace(VARIABLES))

        .pipe(rename(path => { path.basename = "jdenticon-node"; path.extname = ".mjs" }))

        .pipe(sourcemaps.write("./"))
        .pipe(gulp.dest("./dist"))
        
        .pipe(rename(function (path) { path.basename = "jdenticon-node-" + pack.version; path.extname = ".mjs" }))
        .pipe(gulp.dest("./obj/output"));
});

gulp.task("update-license-year", function () {
    return gulp.src("./LICENSE")
        .pipe(replace(/\(c\) 2014-\d+/, "(c) 2014-" + new Date().getFullYear()))
        .pipe(gulp.dest("./"))
});

gulp.task("update-readme-version", function () {
    return gulp.src("./README.md")
        .pipe(replace(/@\d{1,2}\.\d{1,3}\.\d{1,3}/, "@" + pack.version))
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
 
gulp.task("clean-tests", function (cb) {
    del(["./obj/test/unit/**"], cb);
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

gulp.task("nuget", function (cb) {
    var command = "\"./build/nuget/nuget.exe\" pack ~jdenticon.nuspec -OutputDirectory releases";

    if (process.platform !== "win32") {
        command = "mono " + command;
    }

    exec(command, function (error, stdout, stderr) {
        if (error) {
            cb(error);
        } else {
            del(["./~jdenticon.nuspec"], cb);
        }
    });
});

gulp.task("create-package", function () {
    return gulp.src(["./obj/output/*"])
        .pipe(zip("jdenticon-" + pack.version + ".zip"))
        .pipe(gulp.dest("releases"));
});

gulp.task("release", gulp.series(
    "update-license-year", "update-readme-version",
    "build",
    "prepare-release",
    "create-package",
    "prepare-nuget", "nuget",
));

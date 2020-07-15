/**
 * Jdenticon
 * https://github.com/dmester/jdenticon
 * Copyright © Daniel Mester Pirttijärvi
 */
"use strict";

const pipe = require("multipipe");
const del = require("del");
const fs = require("fs");
const { exec } = require("child_process");
const pack = require("./package.json");

// Gulp dependencies
const gulp = require("gulp");
const rename = require("gulp-rename");
const closure = require("google-closure-compiler").gulp();
const zip = require("gulp-zip");
const replace = require("gulp-replace-with-sourcemaps");
const wrap = require("gulp-wrap");
const buble = require("gulp-buble");
const sourcemaps = require("gulp-sourcemaps");

// Rollup dependencies
const rollup = require("./build/rollup-stream");
const commonjs = require( "@rollup/plugin-commonjs");
const stripBanner = require("rollup-plugin-strip-banner");


function getVariables() {
    return [
        [/#version#/g, pack.version],
        [/#year#/g, new Date().getFullYear()],
        [/#date#/g, new Date().toISOString()],
    ]
}

function replaceVariables() {
    return pipe(...getVariables().map(variable => replace(...variable)));
}
    
function getWrapper(source, placeholder) {
    return getVariables().reduce(
        (result, variable) => result.replace(...variable),
        fs.readFileSync(source)
            .toString()
            .replace(/<%=contents%>/, placeholder));
}

gulp.task("clean", function (cb) {
    del(["./~jdenticon.nuspec", "./obj"], cb);
});

gulp.task("build-js", function () {
    return gulp.src("./src/browser.js")
        .pipe(rollup({
            output: { format: "cjs" },
            plugins: [ stripBanner() ],
        }))

        // The UMD template expects a factory function body, so replace export with a return for the factory function.
        .pipe(replace(/module.exports = /, "return "))
        .pipe(replaceVariables())
        .pipe(wrap(getWrapper("./build/template.js", "<%=contents%>")))
        .pipe(buble())
        
        .pipe(rename(function (path) { path.basename = "jdenticon"; path.extname = ".js" }))
        .pipe(gulp.dest("dist"))
        
        .pipe(rename(function (path) { path.basename = "jdenticon-" + pack.version; path.extname = ".js" }))
        .pipe(gulp.dest("obj/output"));
});

gulp.task("build-js-min", function () {
    return gulp.src("./src/browser.js")
        .pipe(rollup({
            output: { format: "cjs" },
        }))

        // The UMD template expects a factory function body, so replace export with a return for the factory function.
        .pipe(replace(/module.exports = /, "return "))
        .pipe(replaceVariables())
        .pipe(wrap(getWrapper("./build/template.js", "<%=contents%>")))
        
        // Prepare for minification
        .pipe(sourcemaps.init())
        
        // Closure does not know that ELEMENT_NODE is a constant. Replace it before passing it on to Closure.
        .pipe(replace(/Node\.ELEMENT_NODE/g, "1"))
        
        // Minified file
        .pipe(closure({
            compilation_level: "ADVANCED",
            rewritePolyfills: false,
            createSourceMap: true,
            outputWrapper: getWrapper("./build/template.min.js", "%output%"),
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

gulp.task("build-node", function () {
    return gulp.src("./src/node.js")
        .pipe(sourcemaps.init())
        .pipe(rollup({
            external: [ "canvas-renderer" ],
            plugins: [ stripBanner(), commonjs() ],
            output: { format: "cjs" },
        }))

        .pipe(replaceVariables())

        .pipe(rename(path => { path.basename = "jdenticon-node"; path.extname = ".js" }))

        .pipe(sourcemaps.write("./"))
        .pipe(gulp.dest("./dist"));

});

gulp.task("build", gulp.series("clean", gulp.parallel(
    "build-js",
    "build-js-min",
    "build-node",
)));

gulp.task("preparerelease", function () {
    return gulp.src(["./LICENSE", "./README.md"])
        .pipe(replaceVariables())
        .pipe(rename(function (path) { path.extname = ".txt" }))
        .pipe(gulp.dest("obj/output"));
});

gulp.task("preparenuget", function () {
    return gulp.src(["./build/jdenticon.nuspec"])
        .pipe(replaceVariables())
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

gulp.task("createpackage", function () {
    return gulp.src(["./obj/output/*"])
        .pipe(zip("jdenticon-" + pack.version + ".zip"))
        .pipe(gulp.dest("releases"));
});

gulp.task("release", gulp.series("build", "preparerelease", "createpackage", "preparenuget", "nuget"));

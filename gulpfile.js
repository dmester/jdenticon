/**
 * Jdenticon
 * https://github.com/dmester/jdenticon
 * Copyright © Daniel Mester Pirttijärvi
 */
"use strict";

const gulp       = require("gulp"),
      del        = require("del"),
      fs         = require("fs"),
      rename     = require("gulp-rename"),
      closure    = require('google-closure-compiler').gulp(),
      zip        = require("gulp-zip"),
      replace    = require("gulp-replace"),
      replacejs  = require('gulp-replace-with-sourcemaps'),
      wrap       = require("gulp-wrap"),
      exec       = require("child_process").exec,
      merge      = require("./build/mergeRequire"),
      pack       = require("./package.json"),
      sourcemaps = require('gulp-sourcemaps');

function getWrapper(source, placeholder) {
    return fs.readFileSync(source)
        .toString()
        .replace(/<%=contents%>/, placeholder)
        .replace(/\{version\}/g, pack.version)
        .replace(/\{year\}/g, new Date().getFullYear())
        .replace(/\{date\}/g, new Date().toISOString());
}

gulp.task("clean", function (cb) {
    del(["./~jdenticon.nuspec", "./obj"], cb);
});

gulp.task("build-js", function build() {
    return gulp.src("./src/browser.js")   
        .pipe(merge(function (source) {
            // Remove license banner
            source = source.replace(/^\/\*(?:[\s\S]*?)\*\//, "");
            
            // Remove use strict
            source = source.replace(/^\s+\"use strict\";\r?\n/g, "");
            
            // Remove require
            source = source.replace(/\b(?:var|const)\s+\w+\s*=\s*require\([^)]+\);\r?\n/g, "");
            
            // Remove module exports
            source = source.replace(/\bmodule\.exports\s*=[^;]+;/g, "");
            
            return source;
        }))
        
        // Debug section
        .pipe(replace(/\/\/\s*\<debug\>[\s\S]*?\/\/\s*\<\/debug\>/g, ""))
        
        // Replace variables
        .pipe(wrap(getWrapper("./build/template.js", "<%=contents%>")))
        .pipe(replace(/\{version\}/g, pack.version))
        
        .pipe(rename(function (path) { path.basename = "jdenticon"; path.extname = ".js" }))
        .pipe(gulp.dest("dist"))
        
        .pipe(rename(function (path) { path.basename = "jdenticon-" + pack.version; path.extname = ".js" }))
        .pipe(gulp.dest("obj"))

        // Prepare for minification
        .pipe(sourcemaps.init())
        
        // Closure does not know that ELEMENT_NODE is a constant. Replace it before passing it on to Closure.
        .pipe(replacejs(/Node\.ELEMENT_NODE/g, "1"))
        
        // Minified file
        .pipe(closure({ 
            compilation_level: "ADVANCED" ,
            rewritePolyfills: false,
            createSourceMap: true,
            outputWrapper: getWrapper("./build/template.min.js", "%output%"),
            externs: [
                { src: "var module; function define(deps, cb) { }" }
            ],
        }, {
            platform: ["javascript"]
        }))

        .pipe(rename(function (path) { path.basename = "jdenticon"; path.extname = ".min.js" }))
        .pipe(sourcemaps.write('.', { 
            mapSources: (path) => "jdenticon.js"
        }))
        .pipe(gulp.dest("dist"))
        
        .pipe(rename(function (path) { path.basename = "jdenticon-" + pack.version; path.extname = ".min.js" }))
        .pipe(sourcemaps.write('.', { 
            mapSources: (path) => `jdenticon-${pack.version}.js`
        }))
        .pipe(gulp.dest("obj"));
});

gulp.task("build", gulp.series("clean", "build-js"));

gulp.task("preparerelease", function () {
    return gulp.src(["./LICENSE", "./README.md"])
        .pipe(replace(/\{version\}/g, pack.version))
        .pipe(replace(/\{year\}/g, new Date().getFullYear()))
        .pipe(replace(/\{date\}/g, new Date().toISOString()))
        .pipe(rename(function (path) { path.extname = ".txt" }))
        .pipe(gulp.dest("obj"));
});

gulp.task("preparenuget", function () {
    return gulp.src(["./build/jdenticon.nuspec"])
        .pipe(replace(/\{version\}/g, pack.version))
        .pipe(replace(/\{year\}/g, new Date().getFullYear()))
        .pipe(replace(/\{date\}/g, new Date().toISOString()))
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
    return gulp.src(["./obj/*"])
        .pipe(zip("jdenticon-" + pack.version + ".zip"))
        .pipe(gulp.dest("releases"));
});

gulp.task("release", gulp.series("build", "preparerelease", "createpackage", "preparenuget", "nuget"));

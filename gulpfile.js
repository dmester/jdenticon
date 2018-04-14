/**
 * Jdenticon
 * https://github.com/dmester/jdenticon
 * Copyright © Daniel Mester Pirttijärvi
 * 
 * This file contains the public interface of Jdenticon.
 */
"use strict";

const gulp     = require("gulp"),
      del      = require("del"),
      rename   = require("gulp-rename"),
      closure  = require('google-closure-compiler-js').gulp(),
      zip      = require("gulp-zip"),
      replace  = require("gulp-replace"),
      wrap     = require("gulp-wrap"),
      exec     = require("child_process").exec,
      merge    = require("./build/mergeRequire"),
      pack     = require("./package.json");

gulp.task("clean", function (cb) {
    del(["./~jdenticon.nuspec", "./obj"], cb);
});

gulp.task("build", ["clean"], function () {
    return gulp.src("./src/jdenticon.js")
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
        .pipe(wrap({ src: "./template.js" }))
        .pipe(replace(/\{version\}/g, pack.version))
        .pipe(replace(/\{year\}/g, new Date().getFullYear()))
        .pipe(replace(/\{date\}/g, new Date().toISOString()))
        
        .pipe(rename(function (path) { path.basename = "jdenticon"; path.extname = ".js" }))
        .pipe(gulp.dest("dist"))
        
        .pipe(rename(function (path) { path.basename = "jdenticon-" + pack.version; path.extname = ".js" }))
        .pipe(gulp.dest("obj"))
        
        // Minified file
        .pipe(closure({ 
            compilation_level: "ADVANCED_OPTIMIZATIONS" ,
            rewritePolyfills: false,
            createSourceMap: true,
            externs: [
                { src: "var module; function define(deps, cb) { }" }
            ],
        }))
        .pipe(wrap({ src: "./template.min.js" }))
        .pipe(replace(/\{version\}/g, pack.version))
        .pipe(replace(/\{year\}/g, new Date().getFullYear()))
        .pipe(replace(/\{date\}/g, new Date().toISOString()))
        
        .pipe(rename(function (path) { path.basename = "jdenticon"; path.extname = ".min.js" }))
        .pipe(gulp.dest("dist"))
        
        .pipe(rename(function (path) { path.basename = "jdenticon-" + pack.version; path.extname = ".min.js" }))
        .pipe(gulp.dest("obj"));
});

gulp.task("preparerelease", ["build"], function () {
    return gulp.src(["./LICENSE", "./README.md"])
        .pipe(replace(/\{version\}/g, pack.version))
        .pipe(replace(/\{year\}/g, new Date().getFullYear()))
        .pipe(replace(/\{date\}/g, new Date().toISOString()))
        .pipe(rename(function (path) { path.extname = ".txt" }))
        .pipe(gulp.dest("obj"));
});

gulp.task("preparenuget", ["build"], function () {
    return gulp.src(["./jdenticon.nuspec"])
        .pipe(replace(/\{version\}/g, pack.version))
        .pipe(replace(/\{year\}/g, new Date().getFullYear()))
        .pipe(replace(/\{date\}/g, new Date().toISOString()))
        .pipe(rename(function (path) { path.basename = "~" + path.basename }))
        .pipe(gulp.dest("./"));
});

gulp.task("nuget", ["preparenuget", "preparerelease"], function (cb) {
    exec("\"./utils/nuget/nuget.exe\" pack ~jdenticon.nuspec -OutputDirectory releases", function (error, stdout, stderr) {
        if (error) {
            cb(error);
        } else {
            del(["./~jdenticon.nuspec"], cb);
        }
    });
});

gulp.task("createpackage", ["preparerelease"], function () {
    return gulp.src(["./obj/*"])
        .pipe(zip("jdenticon-" + pack.version + ".zip"))
        .pipe(gulp.dest("releases"));
});

gulp.task("release", ["createpackage", "nuget"]);

var gulp     = require("gulp"),
    del      = require('del'),
    rename   = require("gulp-rename"),
    nuget    = require("gulp-nuget"),
    closure  = require("gulp-closure-compiler-service"),
    zip      = require('gulp-zip'),
    optimize = require('gulp-requirejs-optimize'),
    replace  = require("gulp-replace"),
    wrap     = require("gulp-wrap"),
    exec     = require('child_process').exec,
    pack     = require("./package.json");

gulp.task("clean", function (cb) {
    del(["./~jdenticon.nuspec", "./obj"], cb);
});

gulp.task("build", ["clean"], function () {
    return gulp.src("./src/jdenticon.js")
        .pipe(optimize({ optimize: 'none' }))
        
        // Debug section
        .pipe(replace(/\/\/\s*\<debug\>[\s\S]*?\/\/\s*\<\/debug\>/g, ""))
        
        // Remove define wrappers
        .pipe(replace(/^\/\*(?:[\s\S]*?)\*\//, "")) // Header
        .pipe(replace(/return[^;]+;[\r\n]+\}\);[\r\n]\s*(?:(?:\/\*(?:[\s\S]*?)\*\/)\s*|(?:\/\/(?:.*)\s*))*define\([^{]+{/g, ""))
        .pipe(replace(/define\([^{]+{/g, ""))
        .pipe(replace(/\}\);\s*$/g, ""))
        
        // Remove "use strict" from source files
        .pipe(replace(/\"use strict\";/g, ""))
        
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
        .pipe(closure({ compilation_level: "ADVANCED_OPTIMIZATIONS" }))
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
    return gulp.src(["./license.txt", "./readme.md", "./changelog.txt"])
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

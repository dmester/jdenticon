/**
 * Jdenticon
 * https://github.com/dmester/jdenticon
 * Copyright © Daniel Mester Pirttijärvi
 */
"use strict";

const through   = require('through2'),
      mdeps     = require('module-deps'),
      path      = require('path'),
      stripBom  = require('strip-bom');

/**
 * Merges the input files with all their require dependencies.
 * 
 * The function has two constraints that are not validated during build:
 *
 *  1. All modules are put into a single scope, meaning that all global 
 *     identifiers within a module must be unique across all merged 
 *     modules. 
 *
 *  2. A module is always assumed to be imported to a variable with the 
 *     same name as the imported module itself. 
 * 
 * These constraints reduces the extra payload that a module loader like 
 * Browserify or Webpack would add to the resulting module.
 *
 * @param {function=} mapFunction  
 *    Callback that will be called for each dependency file content.
 */
function mergeRequire() {
    return through.obj(function(file, enc, cb) {
        if (file.isNull()) {
            cb(null, file);
            return;
        }
        
        var concatenatedSource = "";
        var externalImports = [];
        
        var md = mdeps({
            filter: function (id) {
                return /^\./.test(id);
            }
        });
            md.pipe(through.obj(function (data, enc, callback) {
                var source = stripBom(data.source);
                var name = path.parse(data.file);

                // Repack package.json to only contain `name` and `version`
                if (/^package\.json$/i.test(name.base)) {
                    var parsedPackageJson = JSON.parse(source);
                    var strippedPackageJson = {};
                    if ("name" in parsedPackageJson) {
                        strippedPackageJson.name = parsedPackageJson.name;
                    }
                    if ("version" in parsedPackageJson) {
                        strippedPackageJson.version = parsedPackageJson.version;
                    }
                    source = "var pack = " + JSON.stringify(strippedPackageJson) + ";\n\n";
                }
                
                // Remove license banner
                source = source.replace(/^\/\*(?:[\s\S]*?)\*\//, "");
                
                // Remove use strict
                source = source.replace(/^\s+\"use strict\";\r?\n/g, "");
                
                // Remove require
                source = source.replace(/\b(?:var|const)\s+\w+\s*=\s*require\([^)]+\);\r?\n/g, function (match) {
                    var nameMatch = /require\(["'](.)/.exec(match);
                    if (nameMatch && nameMatch[1] !== ".") {
                        externalImports.push(match);
                    }
                    return "";
                });
                
                // Remove module exports
                source = source.replace(/\bmodule\.exports\s*=[^;]+;/g, "");

                // Trim excessive whitespace
                source = source.trim() + "\n\n";
            
                concatenatedSource += source;
                callback("");
            }, function () {
                file.contents = Buffer.from((externalImports.join("") + "\n" + concatenatedSource).trim());
                cb(null, file);
            }));
            md.end({ file: file.path });
    });
}

module.exports = mergeRequire;

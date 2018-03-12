/**
 * Jdenticon
 * https://github.com/dmester/jdenticon
 * Copyright © Daniel Mester Pirttijärvi
 */
"use strict";

const through   = require('through2'),
      mdeps     = require('module-deps'),
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
function mergeRequire(mapFunction) {
    return through.obj(function(file, enc, cb) {
        if (file.isNull()) {
            cb(null, file);
            return;
        }
        
        var concatenatedSource = "";
        
        var md = mdeps();
            md.pipe(through.obj(function (data, enc, callback) {
                var source = stripBom(data.source);
                
                if (typeof mapFunction == "function") {
                    source = mapFunction(source);
                }
            
                concatenatedSource += source;
                callback("");
            }, function () {
                file.contents = new Buffer(concatenatedSource);
                cb(null, file);
            }));
            md.end({ file: file.path });
    });
}

module.exports = mergeRequire;

/**
 * Jdenticon
 * http://jdenticon.com
 * 
 * Copyright (c) 2014-2018 Daniel Mester Pirttijärvi
 *
 * Permission is hereby granted, free of charge, to any person obtaining 
 * a copy of this software and associated documentation files (the 
 * "Software"), to deal in the Software without restriction, including 
 * without limitation the rights to use, copy, modify, merge, publish, 
 * distribute, sublicense, and/or sell copies of the Software, and to 
 * permit persons to whom the Software is furnished to do so, subject to 
 * the following conditions:
 * 
 * The above copyright notice and this permission notice shall be 
 * included in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, 
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF 
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. 
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY 
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, 
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE 
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 * 
 */

"use strict";

if (typeof require !== "function" ||
    typeof module !== "object" ||
    typeof module.exports !== "object") {
    throw new Error(
        "Jdenticon: index.js is only intended for Node.js environments. " +
        "If you want to run Jdenticon in the browser, please add a reference " +
        "to 'dist/jdenticon.js' or 'dist/jdenticon.min.js' instead.");
}

const canvasRenderer = require("canvas-renderer"),
      pack           = require("./package.json"),
      jdenticon      = require("./src/jdenticon");

module.exports = {};

/**
 * Specifies the version of the Jdenticon package in use.
 * @type {string}
 */
module.exports.version = pack.version;

/**
 * Specifies the color options for the generated icons. See options at http://jdenticon.com/js-api.html#jdenticon-config
 * @type {object} 
 */
module.exports.config = {};

/**
 * Draws an identicon as an SVG string.
 * @param {any} hashOrValue - A hexadecimal hash string or any value that will be hashed by Jdenticon.
 * @param {number} size - Icon size in pixels.
 * @param {number=} padding - Optional padding in percents. Extra padding might be added to center the rendered identicon.
 * @returns {string} SVG string
 */
module.exports.toSvg = function toSvg(hashOrValue, size, padding) {
    // Copy config to base jdenticon object
    jdenticon.config = module.exports.config;
    
    return jdenticon.toSvg(hashOrValue, size, padding);
};

/**
 * Draws an identicon as PNG.
 * @param {any} hashOrValue - A hexadecimal hash string or any value that will be hashed by Jdenticon.
 * @param {number} size - Icon size in pixels.
 * @param {number=} padding - Optional padding in percents. Extra padding might be added to center the rendered identicon.
 * @returns {Buffer} PNG data
 */
module.exports.toPng = function toPng(hashOrValue, size, padding) {
    var canvas = canvasRenderer.createCanvas(size, size);
    var ctx = canvas.getContext("2d");
    
    if (typeof padding !== "number") {
        padding = 0.08;
    }
    
    // Copy config to base jdenticon object
    jdenticon.config = module.exports.config;
    jdenticon.drawIcon(ctx, hashOrValue, size, padding);
    
    return canvas.toPng({ "Software": "Jdenticon" });
};

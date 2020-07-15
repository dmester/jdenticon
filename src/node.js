/**
 * Jdenticon
 * https://github.com/dmester/jdenticon
 * Copyright © Daniel Mester Pirttijärvi
 * 
 * This file contains the public interface of Jdenticon for Node.js.
 */

if (typeof process === "undefined" &&
    typeof window !== "undefined" &&
    typeof document !== "undefined"
) {
    console.warn(
        "Jdenticon: dist/jdenticon-node.js is only intended for Node.js environments. " +
        "If you want to run Jdenticon in the browser, please add a reference " +
        "to 'dist/jdenticon.js' or 'dist/jdenticon.min.js' instead.");
}

// This file is still using CommonJS to allow modifying the `config` property when Jenticon is imported using CommonJS.
// If this file was converted to an ES module, the `config` property would be write protected.
const { createCanvas } = require("canvas-renderer");
const { iconGenerator } = require("./renderer/iconGenerator");
const { SvgRenderer } = require("./renderer/svg/svgRenderer");
const { SvgWriter } = require("./renderer/svg/svgWriter");
const { computeHash, isValidHash } = require("./common/hashUtils");
const { CanvasRenderer } = require("./renderer/canvas/index");
const { configuration } = require("./common/configuration");

/**
 * Updates all canvas elements with the `data-jdenticon-hash` or `data-jdenticon-value` attribute.
 * @throws {Error}
 */
function jdenticon() {
    throw new Error("jdenticon() is not supported on Node.js.");
}

/**
 * Specifies the version of the Jdenticon package in use.
 * @type {string}
 */
jdenticon.version = "#version#";

/**
 * Specifies the color options for the generated icons. See options at 
 * {@link https://jdenticon.com/js-api/P_jdenticon_config.html}
 * @type {Object} 
 */
jdenticon.config = {};

/**
 * Draws an identicon to a context.
 * @param {CanvasRenderingContext2D} ctx - Canvas context on which the icon will be drawn at location (0, 0).
 * @param {*} hashOrValue - A hexadecimal hash string or any value that will be hashed by Jdenticon.
 * @param {number} size - Icon size in pixels.
 * @param {Object|number=} config - Optional configuration. If specified, this configuration object overrides any
 *    global configuration in its entirety. For backward compability a padding value in the range [0.0, 0.5) can be
 *    specified in place of a configuration object.
 */
jdenticon.drawIcon = function drawIcon(ctx, hashOrValue, size, config) {
    if (!ctx) {
        throw new Error("No canvas specified.");
    }
    
    iconGenerator(new CanvasRenderer(ctx, size), 
        isValidHash(hashOrValue) || computeHash(hashOrValue), 
        0, 0, size, configuration(jdenticon, jdenticon, config, 0));
}

/**
 * Draws an identicon as an SVG string.
 * @param {*} hashOrValue - A hexadecimal hash string or any value that will be hashed by Jdenticon.
 * @param {number} size - Icon size in pixels.
 * @param {Object|number=} config - Optional configuration. If specified, this configuration object overrides any
 *    global configuration in its entirety. For backward compability a padding value in the range [0.0, 0.5) can be
 *    specified in place of a configuration object.
 * @returns {string} SVG string
 */
jdenticon.toSvg = function toSvg(hashOrValue, size, config) {
    const writer = new SvgWriter(size);
    iconGenerator(new SvgRenderer(writer), 
        isValidHash(hashOrValue) || computeHash(hashOrValue),
        0, 0, size, configuration(jdenticon, jdenticon, config, 0.08));
    return writer.toString();
}

/**
 * Draws an identicon as PNG.
 * @param {*} hashOrValue - A hexadecimal hash string or any value that will be hashed by Jdenticon.
 * @param {number} size - Icon size in pixels.
 * @param {Object|number=} config - Optional configuration. If specified, this configuration object overrides any
 *    global configuration in its entirety. For backward compability a padding value in the range [0.0, 0.5) can be
 *    specified in place of a configuration object.
 * @returns {Buffer} PNG data
 */
jdenticon.toPng = function toPng(hashOrValue, size, config) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext("2d");
    
    iconGenerator(new CanvasRenderer(ctx, size), 
        isValidHash(hashOrValue) || computeHash(hashOrValue), 
        0, 0, size, configuration(jdenticon, jdenticon, config, 0.08));
    
    return canvas.toPng({ "Software": "Jdenticon" });
};

/**
 * Updates the identicon in the specified canvas or svg elements.
 * @throws {Error}
 */
jdenticon.update = function update() {
    throw new Error("jdenticon.update() is not supported on Node.js.");
};

module.exports = jdenticon;
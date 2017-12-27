/**
 * Jdenticon
 * https://github.com/dmester/jdenticon
 * Copyright © Daniel Mester Pirttijärvi
 * 
 * This file contains the public interface of Jdenticon.
 */
"use strict";

const iconGenerator = require("./iconGenerator");
const SvgRenderer = require("./svgRenderer");
const SvgElement = require("./svgElement");
const SvgWriter = require("./svgWriter");
const sha1 = require("./sha1");
const CanvasRenderer = require("./canvasRenderer");
 
// <debug>
var global = typeof window !== "undefined" ? window : {},
    jQuery = global.jQuery;
// </debug>

var /** @const */
    HASH_ATTRIBUTE = "data-jdenticon-hash",
    VALUE_ATTRIBUTE = "data-jdenticon-value",
    supportsQuerySelectorAll = typeof document !== "undefined" && "querySelectorAll" in document;

/**
 * Gets the normalized current Jdenticon color configuration. Missing fields have default values.
 */
function getCurrentConfig() {
    var configObject = jdenticon["config"] || global["jdenticon_config"] || { },
        lightnessConfig = configObject["lightness"] || { },
        saturation = configObject["saturation"];
    
    /**
     * Creates a lightness range.
     */
    function lightness(configName, defaultMin, defaultMax) {
        var range = lightnessConfig[configName] instanceof Array ? lightnessConfig[configName] : [defaultMin, defaultMax];
        
        /**
         * Gets a lightness relative the specified value in the specified lightness range.
         */
        return function (value) {
            value = range[0] + value * (range[1] - range[0]);
            return value < 0 ? 0 : value > 1 ? 1 : value;
        };
    }
        
    return {
        saturation: typeof saturation == "number" ? saturation : 0.5,
        colorLightness: lightness("color", 0.4, 0.8),
        grayscaleLightness: lightness("grayscale", 0.3, 0.9)
    }
}

/**
 * Inputs a value that might be a valid hash string for Jdenticon and returns it 
 * if it is determined valid, otherwise a falsy value is returned.
 */
function getValidHash(hashCandidate) {
    return /^[0-9a-f]{11,}$/i.test(hashCandidate) && hashCandidate;
}

/**
 * Computes a hash for the specified value. Currnently SHA1 is used. This function
 * always returns a valid hash.
 */
function computeHash(value) {
    return sha1(value == null ? "" : "" + value);
}

/**
 * Updates the identicon in the specified canvas or svg elements.
 * @param {(string|HTMLElement)} el - Specifies the container in which the icon is rendered. Can be a CSS selector or a DOM element of the type SVG or CANVAS.
 * @param {string=} hash - Optional hash to be rendered. If not specified, the hash specified by the data-jdenticon-hash is used.
 * @param {number=} padding - Optional padding in percents. Extra padding might be added to center the rendered identicon.
 */
function update(el, hash, padding) {
    if (typeof(el) === "string") {
        if (supportsQuerySelectorAll) {
            var elements = document.querySelectorAll(el);
            for (var i = 0; i < elements.length; i++) {
                update(elements[i], hash, padding);
            }
        }
        return;
    }
    if (!el || !el["tagName"]) {
        // No element found
        return;
    }
    
    var isSvg = /svg/i.test(el["tagName"]),
        isCanvas = /canvas/i.test(el["tagName"]);
    
    // Ensure we have a supported element
    if (!isSvg && !(isCanvas && "getContext" in el)) {
        return;
    }
    
    // Hash selection. The result from getValidHash or computeHash is 
    // accepted as a valid hash.
    hash = 
        // 1. Explicit valid hash
        getValidHash(hash) ||
        
        // 2. Explicit value
        hash && computeHash(hash) ||
        
        // 3. `data-jdenticon-hash` attribute
        getValidHash(el.getAttribute(HASH_ATTRIBUTE)) ||
        
        // 4. `data-jdenticon-value` attribute. 
        // We want to treat an empty attribute as an empty value. 
        // Some browsers return empty string even if the attribute 
        // is not specified, so use hasAttribute to determine if 
        // the attribute is specified.
        el.hasAttribute(VALUE_ATTRIBUTE) && computeHash(el.getAttribute(VALUE_ATTRIBUTE));
    
    if (!hash) {
        // No hash specified. Don't render an icon.
        return;
    }
    
    var renderer = isSvg ? 
        new SvgRenderer(new SvgElement(el)) : 
        new CanvasRenderer(el.getContext("2d"));
    
    // Draw icon
    iconGenerator(renderer, hash, 0, 0, renderer.size, padding, getCurrentConfig());
}

/**
 * Draws an identicon to a context.
 * @param {CanvasRenderingContext2D} ctx - Canvas context on which the icon will be drawn at location (0, 0).
 * @param {any} hashOrValue - A hexadecimal hash string or any value that will be hashed by Jdenticon.
 * @param {number} size - Icon size in pixels.
 */
function drawIcon(ctx, hashOrValue, size) {
    if (!ctx) {
        throw new Error("No canvas specified.");
    }
    
    var renderer = new CanvasRenderer(ctx, size);
    iconGenerator(renderer, 
        getValidHash(hashOrValue) || computeHash(hashOrValue), 
        0, 0, size, 0, getCurrentConfig());
}

/**
 * Draws an identicon as an SVG string.
 * @param {any} hashOrValue - A hexadecimal hash string or any value that will be hashed by Jdenticon.
 * @param {number} size - Icon size in pixels.
 * @param {number=} padding - Optional padding in percents. Extra padding might be added to center the rendered identicon.
 * @returns {string} SVG string
 */
function toSvg(hashOrValue, size, padding) {
    var writer = new SvgWriter(size);
    var renderer = new SvgRenderer(writer);
    iconGenerator(renderer, 
        getValidHash(hashOrValue) || computeHash(hashOrValue),
        0, 0, size, padding, getCurrentConfig());
    return writer.toString();
}

/**
 * Updates all canvas elements with the data-jdenticon-hash attribute.
 */
function jdenticon() {
    if (supportsQuerySelectorAll) {
        update("[" + HASH_ATTRIBUTE + "],[" + VALUE_ATTRIBUTE + "]");
    }
}

// Public API
jdenticon["drawIcon"] = drawIcon;
jdenticon["toSvg"] = toSvg;
jdenticon["update"] = update;
jdenticon["version"] = "{version}";

// Basic jQuery plugin
if (jQuery) {
    jQuery["fn"]["jdenticon"] = function (hashOrValue, padding) {
        this["each"](function (index, el) {
            update(el, hashOrValue, padding);
        });
        return this;
    };
}

// Schedule to render all identicons on the page once it has been loaded.
if (typeof setTimeout === "function") {
    setTimeout(jdenticon, 0);
}

module.exports = jdenticon;

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
const color = require("./color");
const observer = require("./observer");
const dom = require("./dom");
 
// <debug>
var global = typeof window !== "undefined" ? window : {},
    jQuery = global.jQuery;
// </debug>

/**
 * Gets the normalized current Jdenticon color configuration. Missing fields have default values.
 */
function getCurrentConfig() {
    var configObject = jdenticon["config"] || global["jdenticon_config"] || { },
        lightnessConfig = configObject["lightness"] || { },
        
        // In versions < 2.1.0 there was no grayscale saturation -
        // saturation was the color saturation.
        saturation = configObject["saturation"] || { },
        colorSaturation = "color" in saturation ? saturation["color"] : saturation,
        grayscaleSaturation = saturation["grayscale"],

        backColor = configObject["backColor"];
    
    /**
     * Creates a lightness range.
     */
    function lightness(configName, defaultRange) {
        var range = lightnessConfig[configName];
        
        // Check if the lightness range is an array-like object. This way we ensure the
        // array contain two values at the same time.
        if (!(range && range.length > 1)) {
            range = defaultRange;
        }

        /**
         * Gets a lightness relative the specified value in the specified lightness range.
         */
        return function (value) {
            value = range[0] + value * (range[1] - range[0]);
            return value < 0 ? 0 : value > 1 ? 1 : value;
        };
    }

    /**
     * Gets a hue allowed by the configured hue restriction,
     * provided the originally computed hue.
     */
    function hueFunction(originalHue) {
        var hueConfig = configObject["hues"], hue;
        
        // Check if 'hues' is an array-like object. This way we also ensure that
        // the array is not empty, which would mean no hue restriction.
        if (hueConfig && hueConfig.length > 0) {
            // originalHue is in the range [0, 1]
            // Multiply with 0.999 to change the range to [0, 1) and then truncate the index.
            hue = hueConfig[0 | (0.999 * originalHue * hueConfig.length)];
        }

        return typeof hue == "number" ?
            
            // A hue was specified. We need to convert the hue from
            // degrees on any turn - e.g. 746° is a perfectly valid hue -
            // to turns in the range [0, 1).
            ((((hue / 360) % 1) + 1) % 1) :

            // No hue configured => use original hue
            originalHue;
    }
        
    return {
        hue: hueFunction,
        colorSaturation: typeof colorSaturation == "number" ? colorSaturation : 0.5,
        grayscaleSaturation: typeof grayscaleSaturation == "number" ? grayscaleSaturation : 0,
        colorLightness: lightness("color", [0.4, 0.8]),
        grayscaleLightness: lightness("grayscale", [0.3, 0.9]),
        backColor: color.parse(backColor)
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
 * @param {(string|Element)} el - Specifies the container in which the icon is rendered. Can be a CSS selector or a DOM element of the type SVG or CANVAS.
 * @param {string=} hash - Optional hash to be rendered. If not specified, the hash specified by the data-jdenticon-hash is used.
 * @param {number=} padding - Optional padding in percents. Extra padding might be added to center the rendered identicon.
 */
function update(el, hash, padding) {
    if (typeof(el) === "string") {
        if (dom.supportsQuerySelectorAll) {
            var elements = document.querySelectorAll(el);
            for (var i = 0; i < elements.length; i++) {
                update(elements[i], hash, padding);
            }
        }
        return;
    }

    var iconType = dom.getIdenticonType(el);
    if (!iconType) {
        return;
    }
    
    // Hash selection. The result from getValidHash or computeHash is 
    // accepted as a valid hash.
    hash = 
        // 1. Explicit valid hash
        getValidHash(hash) ||
        
        // 2. Explicit value (`!= null` catches both null and undefined)
        hash != null && computeHash(hash) ||
        
        // 3. `data-jdenticon-hash` attribute
        getValidHash(el.getAttribute(dom.HASH_ATTRIBUTE)) ||
        
        // 4. `data-jdenticon-value` attribute. 
        // We want to treat an empty attribute as an empty value. 
        // Some browsers return empty string even if the attribute 
        // is not specified, so use hasAttribute to determine if 
        // the attribute is specified.
        el.hasAttribute(dom.VALUE_ATTRIBUTE) && computeHash(el.getAttribute(dom.VALUE_ATTRIBUTE));
    
    if (!hash) {
        // No hash specified. Don't render an icon.
        return;
    }
    
    var renderer = iconType == dom.ICON_TYPE_SVG ? 
        new SvgRenderer(new SvgElement(el)) : 
        new CanvasRenderer(el.getContext("2d"));
    
    // Draw icon
    iconGenerator(renderer, hash, 0, 0, renderer.size, padding, getCurrentConfig());
}

/**
 * Draws an identicon to a context.
 * @param {CanvasRenderingContext2D} ctx - Canvas context on which the icon will be drawn at location (0, 0).
 * @param {*} hashOrValue - A hexadecimal hash string or any value that will be hashed by Jdenticon.
 * @param {number} size - Icon size in pixels.
 */
function drawIcon(ctx, hashOrValue, size, padding) {
    if (!ctx) {
        throw new Error("No canvas specified.");
    }
    
    var renderer = new CanvasRenderer(ctx, size);
    iconGenerator(renderer, 
        getValidHash(hashOrValue) || computeHash(hashOrValue), 
        0, 0, size, padding || 0, getCurrentConfig());
}

/**
 * Draws an identicon as an SVG string.
 * @param {*} hashOrValue - A hexadecimal hash string or any value that will be hashed by Jdenticon.
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
    if (dom.supportsQuerySelectorAll) {
        update(dom.ICON_SELECTOR);
    }
}

/**
 * This function is called once upon page load.
 */
function jdenticonStartup() {
    var replaceMode = (jdenticon["config"] || global["jdenticon_config"] || { })["replaceMode"];
    if (replaceMode != "never") {
        jdenticon();
        
        if (replaceMode == "observe") {
            observer(update);
        }
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
    setTimeout(jdenticonStartup, 0);
}

module.exports = jdenticon;

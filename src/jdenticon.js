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
const hashUtils = require("./hashUtils");
const CanvasRenderer = require("./canvasRenderer");
const configuration = require("./configuration");
const observer = require("./observer");
const dom = require("./dom");
 
// <debug>
var global = typeof window !== "undefined" ? window : {},
    jQuery = global.jQuery;
// </debug>

/**
 * Updates the identicon in the specified canvas or svg elements.
 * @param {(string|Element)} el - Specifies the container in which the icon is rendered. Can be a CSS selector or a DOM element of the type SVG or CANVAS.
 * @param {string=} hash - Optional hash to be rendered. If not specified, the hash specified by the data-jdenticon-hash is used.
 * @param {Object|number=} config - Optional configuration. If specified, this configuration object overrides any
 *    global configuration in its entirety. For backward compability a padding can also be specified as configuration.
 */
function update(el, hash, config) {
    if (typeof(el) === "string") {
        if (dom.supportsQuerySelectorAll) {
            var elements = document.querySelectorAll(el);
            for (var i = 0; i < elements.length; i++) {
                update(elements[i], hash, config);
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
        hashUtils.validHash(hash) ||
        
        // 2. Explicit value (`!= null` catches both null and undefined)
        hash != null && hashUtils.computeHash(hash) ||
        
        // 3. `data-jdenticon-hash` attribute
        hashUtils.validHash(el.getAttribute(dom.HASH_ATTRIBUTE)) ||
        
        // 4. `data-jdenticon-value` attribute. 
        // We want to treat an empty attribute as an empty value. 
        // Some browsers return empty string even if the attribute 
        // is not specified, so use hasAttribute to determine if 
        // the attribute is specified.
        el.hasAttribute(dom.VALUE_ATTRIBUTE) && hashUtils.computeHash(el.getAttribute(dom.VALUE_ATTRIBUTE));
    
    if (!hash) {
        // No hash specified. Don't render an icon.
        return;
    }
    
    var renderer = iconType == dom.ICON_TYPE_SVG ? 
        new SvgRenderer(new SvgElement(el)) : 
        new CanvasRenderer(el.getContext("2d"));
    
    // Draw icon
    iconGenerator(renderer, hash, 0, 0, renderer.size, configuration(jdenticon, global, config, 0.08));
}

/**
 * Draws an identicon to a context.
 * @param {CanvasRenderingContext2D} ctx - Canvas context on which the icon will be drawn at location (0, 0).
 * @param {*} hashOrValue - A hexadecimal hash string or any value that will be hashed by Jdenticon.
 * @param {number} size - Icon size in pixels.
 * @param {Object|number=} config - Optional configuration. If specified, this configuration object overrides any
 *    global configuration in its entirety. For backward compability a padding can also be specified as configuration.
 */
function drawIcon(ctx, hashOrValue, size, config) {
    if (!ctx) {
        throw new Error("No canvas specified.");
    }
    
    var renderer = new CanvasRenderer(ctx, size);
    iconGenerator(renderer, 
        hashUtils.validHash(hashOrValue) || hashUtils.computeHash(hashOrValue), 
        0, 0, size, configuration(jdenticon, global, config, 0));
}

/**
 * Draws an identicon as an SVG string.
 * @param {*} hashOrValue - A hexadecimal hash string or any value that will be hashed by Jdenticon.
 * @param {number} size - Icon size in pixels.
 * @param {Object|number=} config - Optional configuration. If specified, this configuration object overrides any
 *    global configuration in its entirety. For backward compability a padding can also be specified as configuration.
 * @returns {string} SVG string
 */
function toSvg(hashOrValue, size, config) {
    var writer = new SvgWriter(size);
    var renderer = new SvgRenderer(writer);
    iconGenerator(renderer, 
        hashUtils.validHash(hashOrValue) || hashUtils.computeHash(hashOrValue),
        0, 0, size, configuration(jdenticon, global, config, 0.08));
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
    jQuery["fn"]["jdenticon"] = function (hashOrValue, config) {
        this["each"](function (index, el) {
            update(el, hashOrValue, config);
        });
        return this;
    };
}

// Schedule to render all identicons on the page once it has been loaded.
if (typeof setTimeout === "function") {
    setTimeout(jdenticonStartup, 0);
}

module.exports = jdenticon;

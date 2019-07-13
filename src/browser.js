/**
 * Jdenticon
 * https://github.com/dmester/jdenticon
 * Copyright © Daniel Mester Pirttijärvi
 * 
 * This file contains the public interface of Jdenticon for browsers.
 */
"use strict";

const pack = require("../package.json");
const iconGenerator = require("./renderer/iconGenerator");
const SvgRenderer = require("./renderer/svg/svgRenderer");
const SvgElement = require("./renderer/svg/svgElement");
const SvgWriter = require("./renderer/svg/svgWriter");
const hashUtils = require("./common/hashUtils");
const CanvasRenderer = require("./renderer/canvas");
const configuration = require("./common/configuration");
const observer = require("./common/observer");
const dom = require("./common/dom");
 
// <debug>
var global = typeof window !== "undefined" ? window : {},
    jQuery = global.jQuery;
// </debug>

/**
 * Updates the identicon in the specified canvas or svg elements.
 * @param {(string|Element)} el - Specifies the container in which the icon is rendered as a DOM element of the type
 *    `<svg>` or `<canvas>`, or a CSS selector to such an element.
 * @param {*=} hashOrValue - Optional hash or value to be rendered. If not specified, the `data-jdenticon-hash` or
 *    `data-jdenticon-value` attribute will be evaluated.
 * @param {Object|number=} config - Optional configuration. If specified, this configuration object overrides any
 *    global configuration in its entirety. For backward compability a padding value in the range [0.0, 0.5) can be
 *    specified in place of a configuration object.
 */
function update(el, hashOrValue, config) {
    if (typeof el === "string") {
        if (dom.supportsQuerySelectorAll) {
            var elements = document.querySelectorAll(el);
            for (var i = 0; i < elements.length; i++) {
                update(elements[i], hashOrValue, config);
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
    var hash = 
        // 1. Explicit valid hash
        hashUtils.validHash(hashOrValue) ||
        
        // 2. Explicit value (`!= null` catches both null and undefined)
        hashOrValue != null && hashUtils.computeHash(hashOrValue) ||
        
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
 *    global configuration in its entirety. For backward compability a padding value in the range [0.0, 0.5) can be
 *    specified in place of a configuration object.
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
 *    global configuration in its entirety. For backward compability a padding value in the range [0.0, 0.5) can be
 *    specified in place of a configuration object.
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
 * Updates all canvas elements with the `data-jdenticon-hash` or `data-jdenticon-value` attribute.
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
jdenticon["version"] = pack.version;

// Basic jQuery plugin
if (jQuery) {
    /**
     * Renders an indenticon for all matching supported elements.
     * 
     * @param {*} hashOrValue - A hexadecimal hash string or any value that will be hashed by Jdenticon. If not 
     * specified the `data-jdenticon-hash` and `data-jdenticon-value` attributes of each element will be
     * evaluated.
     * @param {Object|number=} config - Optional configuration. If specified, this configuration object overrides any global
     * configuration in its entirety. For backward compability a padding value in the range [0.0, 0.5) can be
     * specified in place of a configuration object.
     */
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

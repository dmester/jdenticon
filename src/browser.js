/**
 * Jdenticon
 * https://github.com/dmester/jdenticon
 * Copyright © Daniel Mester Pirttijärvi
 * 
 * This file contains the public interface of Jdenticon for browsers.
 */

import { iconGenerator } from "./renderer/iconGenerator";
import { SvgRenderer } from "./renderer/svg/svgRenderer";
import { SvgElement } from "./renderer/svg/svgElement";
import { SvgWriter } from "./renderer/svg/svgWriter";
import { renderDomElement } from "./renderer/renderDomElement";
import { computeHash, isValidHash } from "./common/hashUtils";
import { CanvasRenderer } from "./renderer/canvas/index";
import { configuration } from "./common/configuration";
import { observer } from "./common/observer";
import { ICON_SELECTOR, ICON_TYPE_CANVAS, ICON_TYPE_SVG, getIdenticonType, supportsQuerySelectorAll } from "./common/dom";

/**
 * Updates all canvas elements with the `data-jdenticon-hash` or `data-jdenticon-value` attribute.
 */
function jdenticon() {
    if (supportsQuerySelectorAll) {
        update(ICON_SELECTOR);
    }
}

/**
 * Updates the identicon in the specified `<canvas>` or `<svg>` elements.
 * @param {(string|Element)} el - Specifies the container in which the icon is rendered as a DOM element of the type
 *    `<svg>` or `<canvas>`, or a CSS selector to such an element.
 * @param {*=} hashOrValue - Optional hash or value to be rendered. If not specified, the `data-jdenticon-hash` or
 *    `data-jdenticon-value` attribute will be evaluated.
 * @param {Object|number=} config - Optional configuration. If specified, this configuration object overrides any
 *    global configuration in its entirety. For backward compability a padding value in the range [0.0, 0.5) can be
 *    specified in place of a configuration object.
 */
function update(el, hashOrValue, config) {
    renderDomElement(el, hashOrValue, configuration(jdenticon, global, config, 0.08), function (el) {
        const iconType = getIdenticonType(el);
        if (iconType) {
            return iconType == ICON_TYPE_SVG ? 
                new SvgRenderer(new SvgElement(el)) : 
                new CanvasRenderer(el.getContext("2d"));
        }
    });
}

/**
 * Updates the identicon in the specified `<canvas>` elements.
 * @param {(string|Element)} el - Specifies the container in which the icon is rendered as a DOM element of the type
 *    `<canvas>`, or a CSS selector to such an element.
 * @param {*=} hashOrValue - Optional hash or value to be rendered. If not specified, the `data-jdenticon-hash` or
 *    `data-jdenticon-value` attribute will be evaluated.
 * @param {Object|number=} config - Optional configuration. If specified, this configuration object overrides any
 *    global configuration in its entirety. For backward compability a padding value in the range [0.0, 0.5) can be
 *    specified in place of a configuration object.
 */
function updateCanvas(el, hashOrValue, config) {
    renderDomElement(el, hashOrValue, configuration(jdenticon, global, config, 0.08), function (el) {
        const iconType = getIdenticonType(el);
        if (iconType == ICON_TYPE_CANVAS) {
            return new CanvasRenderer(el.getContext("2d"));
        }
    });
}

/**
 * Updates the identicon in the specified `<svg>` elements.
 * @param {(string|Element)} el - Specifies the container in which the icon is rendered as a DOM element of the type
 *    `<svg>`, or a CSS selector to such an element.
 * @param {*=} hashOrValue - Optional hash or value to be rendered. If not specified, the `data-jdenticon-hash` or
 *    `data-jdenticon-value` attribute will be evaluated.
 * @param {Object|number=} config - Optional configuration. If specified, this configuration object overrides any
 *    global configuration in its entirety. For backward compability a padding value in the range [0.0, 0.5) can be
 *    specified in place of a configuration object.
 */
function updateSvg(el, hashOrValue, config) {
    renderDomElement(el, hashOrValue, configuration(jdenticon, global, config, 0.08), function (el) {
        const iconType = getIdenticonType(el);
        if (iconType == ICON_TYPE_SVG) {
            return new SvgRenderer(new SvgElement(el));
        }
    });
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
    
    iconGenerator(new CanvasRenderer(ctx, size), 
        isValidHash(hashOrValue) || computeHash(hashOrValue), 
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
    const writer = new SvgWriter(size);
    iconGenerator(new SvgRenderer(writer), 
        isValidHash(hashOrValue) || computeHash(hashOrValue),
        0, 0, size, configuration(jdenticon, global, config, 0.08));
    return writer.toString();
}

/**
 * This function is called once upon page load.
 */
function jdenticonStartup() {
    const replaceMode = (jdenticon["config"] || global["jdenticon_config"] || { })["replaceMode"];
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
jdenticon["updateCanvas"] = updateCanvas;
jdenticon["updateSvg"] = updateSvg;
jdenticon["version"] = "#version#";

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

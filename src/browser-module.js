/**
 * Jdenticon
 * https://github.com/dmester/jdenticon
 * Copyright © Daniel Mester Pirttijärvi
 * 
 * This file contains the public module interface of Jdenticon for browsers.
 */

import { iconGenerator } from "./renderer/iconGenerator";
import { SvgRenderer } from "./renderer/svg/svgRenderer";
import { SvgElement } from "./renderer/svg/svgElement";
import { SvgWriter } from "./renderer/svg/svgWriter";
import { renderDomElement } from "./renderer/renderDomElement";
import { computeHash, isValidHash } from "./common/hashUtils";
import { CanvasRenderer } from "./renderer/canvas/index";
import { configuration } from "./common/configuration";
import { ICON_TYPE_CANVAS, ICON_TYPE_SVG, getIdenticonType } from "./common/dom";

/**
 * Specifies the version of the Jdenticon package in use.
 * @type {string}
 */
export const version = "#version#";

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
export function update(el, hashOrValue, config) {
    renderDomElement(el, hashOrValue, configuration({ }, global, config, 0.08), function (el) {
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
export function updateCanvas(el, hashOrValue, config) {
    renderDomElement(el, hashOrValue, configuration({ }, global, config, 0.08), function (el) {
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
export function updateSvg(el, hashOrValue, config) {
    renderDomElement(el, hashOrValue, configuration({ }, global, config, 0.08), function (el) {
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
export function drawIcon(ctx, hashOrValue, size, config) {
    if (!ctx) {
        throw new Error("No canvas specified.");
    }
    
    iconGenerator(new CanvasRenderer(ctx, size), 
        isValidHash(hashOrValue) || computeHash(hashOrValue), 
        0, 0, size, configuration({ }, global, config, 0));
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
export function toSvg(hashOrValue, size, config) {
    const writer = new SvgWriter(size);
    iconGenerator(new SvgRenderer(writer), 
        isValidHash(hashOrValue) || computeHash(hashOrValue),
        0, 0, size, configuration({ }, global, config, 0.08));
    return writer.toString();
}

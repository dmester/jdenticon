/**
 * Jdenticon
 * https://github.com/dmester/jdenticon
 * Copyright © Daniel Mester Pirttijärvi
 */

import { iconGenerator } from "./iconGenerator";
import { isValidHash, computeHash } from "../common/hashUtils";
import { HASH_ATTRIBUTE, VALUE_ATTRIBUTE, supportsQuerySelectorAll } from "../common/dom";

/**
 * Updates the identicon in the specified canvas or svg elements.
 * @param {(string|Element)} el - Specifies the container in which the icon is rendered as a DOM element of the type
 *    `<svg>` or `<canvas>`, or a CSS selector to such an element.
 * @param {*} hashOrValue - Optional hash or value to be rendered. If not specified, the `data-jdenticon-hash` or
 *    `data-jdenticon-value` attribute will be evaluated.
 * @param {Object} config
 * @param {function(Element)} rendererFactory - Factory function for creating an icon renderer.
 */
export function renderDomElement(el, hashOrValue, config, rendererFactory) {
    if (typeof el === "string") {
        if (supportsQuerySelectorAll) {
            const elements = document.querySelectorAll(el);
            for (let i = 0; i < elements.length; i++) {
                renderDomElement(elements[i], hashOrValue, config, rendererFactory);
            }
        }
        return;
    }
    
    // Hash selection. The result from getValidHash or computeHash is 
    // accepted as a valid hash.
    const hash = 
        // 1. Explicit valid hash
        isValidHash(hashOrValue) ||
        
        // 2. Explicit value (`!= null` catches both null and undefined)
        hashOrValue != null && computeHash(hashOrValue) ||
        
        // 3. `data-jdenticon-hash` attribute
        isValidHash(el.getAttribute(HASH_ATTRIBUTE)) ||
        
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
    
    const renderer = rendererFactory(el);
    if (renderer) {
        // Draw icon
        iconGenerator(renderer, hash, 0, 0, renderer.size, config);
    }
}

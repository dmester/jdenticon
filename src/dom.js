/**
 * Jdenticon
 * https://github.com/dmester/jdenticon
 * Copyright © Daniel Mester Pirttijärvi
 */
"use strict";

var dom = {
    /** @const */
    ICON_TYPE_SVG: 1,

    /** @const */
    ICON_TYPE_CANVAS: 2,
    
    /** @const */
    HASH_ATTRIBUTE: "data-jdenticon-hash",
    
    /** @const */
    VALUE_ATTRIBUTE: "data-jdenticon-value",

    supportsQuerySelectorAll: typeof document !== "undefined" && "querySelectorAll" in document,

    getIdenticonType: dom_getIdenticonType
};

/** @const */
dom.ICON_SELECTOR = "[" + dom.HASH_ATTRIBUTE +"],[" + dom.VALUE_ATTRIBUTE +"]";

function dom_getIdenticonType(el) {
    if (el) {
        var tagName = el["tagName"];

        if (/svg/i.test(tagName)) {
            return dom.ICON_TYPE_SVG;
        }

        if (/canvas/i.test(tagName) && "getContext" in el) {
            return dom.ICON_TYPE_CANVAS;
        }
    }
}

module.exports = dom;

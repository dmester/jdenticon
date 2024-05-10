/**
 * Jdenticon
 * https://github.com/dmester/jdenticon
 * Copyright © Daniel Mester Pirttijärvi
 */

export const ICON_TYPE_SVG = 1;

export const ICON_TYPE_CANVAS = 2;

export const ATTRIBUTES = {
    HASH: "data-jdenticon-hash",
    VALUE: "data-jdenticon-value"
};

export const IS_RENDERED_PROPERTY = "jdenticonRendered";

export const ICON_SELECTOR = "[" + ATTRIBUTES.HASH +"],[" + ATTRIBUTES.VALUE +"]";

export const documentQuerySelectorAll = /** @type {!Function} */ (
    typeof document !== "undefined" && document.querySelectorAll.bind(document));

export function getIdenticonType(el) {
    if (el) {
        const tagName = el["tagName"];

        if (/^svg$/i.test(tagName)) {
            return ICON_TYPE_SVG;
        }

        if (/^canvas$/i.test(tagName) && "getContext" in el) {
            return ICON_TYPE_CANVAS;
        }
    }
}

export function whenDocumentIsReady(/** @type {Function} */ callback) {
    function loadedHandler() {
        document.removeEventListener("DOMContentLoaded", loadedHandler);
        window.removeEventListener("load", loadedHandler);
        setTimeout(callback, 0); // Give scripts a chance to run
    }
    
    if (typeof document !== "undefined" &&
        typeof window !== "undefined" &&
        typeof setTimeout !== "undefined"
    ) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", loadedHandler);
            window.addEventListener("load", loadedHandler);
        } else {
            // Document already loaded. The load events above likely won't be raised
            setTimeout(callback, 0);
        }
    }
}

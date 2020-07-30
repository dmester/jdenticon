/**
 * Jdenticon
 * https://github.com/dmester/jdenticon
 * Copyright © Daniel Mester Pirttijärvi
 */

/**
 * Creates a new element and adds it to the specified parent.
 * @param {Element} parentNode
 * @param {string} name
 * @param {...(string|number)} keyValuePairs
 */
function SvgElement_append(parentNode, name, ...keyValuePairs) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", name);
    
    for (let i = 0; i + 1 < keyValuePairs.length; i += 2) {
        el.setAttribute(
            /** @type {string} */ (keyValuePairs[i]),
            /** @type {string|number} */ (keyValuePairs[i + 1]),
            );
    }

    parentNode.appendChild(el);
}


/**
 * Renderer producing SVG output.
 */
export class SvgElement {
    /**
     * @param {Element} element - Target element
     */
    constructor(element) {
        // Don't use the clientWidth and clientHeight properties on SVG elements
        // since Firefox won't serve a proper value of these properties on SVG
        // elements (https://bugzilla.mozilla.org/show_bug.cgi?id=874811)
        // Instead use 100px as a hardcoded size (the svg viewBox will rescale 
        // the icon to the correct dimensions)
        const iconSize = this.iconSize = Math.min(
            (Number(element.getAttribute("width")) || 100),
            (Number(element.getAttribute("height")) || 100)
            );
        this._el = element;
        
        // Clear current SVG child elements
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
        
        // Set viewBox attribute to ensure the svg scales nicely.
        element.setAttribute("viewBox", "0 0 " + iconSize + " " + iconSize);
        element.setAttribute("preserveAspectRatio", "xMidYMid meet");
    }

    /**
     * Fills the background with the specified color.
     * @param {string} fillColor  Fill color on the format #rrggbb.
     * @param {number} opacity  Opacity in the range [0.0, 1.0].
     */
    setBackground(fillColor, opacity) {
        if (opacity) {
            SvgElement_append(this._el, "rect",
                "width", "100%",
                "height", "100%",
                "fill", fillColor,
                "opacity", opacity);
        }
    }

    /**
     * Appends a path to the SVG element.
     * @param {string} color Fill color on format #xxxxxx.
     * @param {string} dataString The SVG path data string.
     */
    appendPath(color, dataString) {
        SvgElement_append(this._el, "path",
            "fill", color,
            "d", dataString);
    }
}

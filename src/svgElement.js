/**
 * Jdenticon
 * https://github.com/dmester/jdenticon
 * Copyright © Daniel Mester Pirttijärvi
 */
"use strict";

/**
 * Renderer producing SVG output.
 * @private
 * @constructor
 */
function SvgElement(element) {
    // Don't use the clientWidth and clientHeight properties on SVG elements
    // since Firefox won't serve a proper value of these properties on SVG
    // elements (https://bugzilla.mozilla.org/show_bug.cgi?id=874811)
    // Instead use 100px as a hardcoded size (the svg viewBox will rescale 
    // the icon to the correct dimensions)
    this.size = Math.min(
        (Number(element.getAttribute("width")) || 100),
        (Number(element.getAttribute("height")) || 100)
        );
    this._el = element;
    
    // Clear current SVG child elements
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
    
    // Set viewBox attribute to ensure the svg scales nicely.
    element.setAttribute("viewBox", "0 0 " + this.size + " " + this.size);
    element.setAttribute("preserveAspectRatio", "xMidYMid meet");
}
SvgElement.prototype = {
    /**
     * Appends a path to the SVG element.
     * @param {string} color Fill color on format #xxxxxx.
     * @param {string} dataString The SVG path data string.
     */
    append: function (color, dataString) {
        var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("fill", color);
        path.setAttribute("d", dataString);
        this._el.appendChild(path);
    }
};

module.exports = SvgElement;

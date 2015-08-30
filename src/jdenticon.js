/**
 * Jdenticon
 * https://github.com/dmester/jdenticon
 * Copyright © Daniel Mester Pirttijärvi
 */

define([
    "./iconGenerator", 
    "./svgRenderer", 
    "./canvasRenderer"], function (
    iconGenerator, 
    SvgRenderer, 
    CanvasRenderer) {
    "use strict";
         
    // <debug>
    var global = window,
        jQuery = window.jQuery;
    // </debug>
    
    var undefined,
		/** @const */
        HASH_ATTRIBUTE = "data-jdenticon-hash",
        supportsQuerySelectorAll = "document" in global && "querySelectorAll" in document;
    
    /**
     * Updates the identicon in the specified canvas or svg elements.
     * @param {string=} hash Optional hash to be rendered. If not specified, the hash specified by the data-jdenticon-hash is used.
     * @param {number=} padding Optional padding in pixels. Extra padding might be added to center the rendered identicon.
     */
    function update(el, hash, padding) {
        if (typeof(el) === "string") {
            if (supportsQuerySelectorAll) {
                var elements = document.querySelectorAll(el);
                for (var i = 0; i < elements.length; i++) {
                    update(elements[i], hash, padding);
                }
            }
            return;
        }
        if (!el || !el["tagName"]) {
            // No element found
            return;
        }
        hash = hash || el.getAttribute(HASH_ATTRIBUTE);
        if (!hash) {
            // No hash specified
            return;
        }
        
        var isSvg = el["tagName"].toLowerCase() == "svg",
            isCanvas = el["tagName"].toLowerCase() == "canvas";
        
        // Ensure we have a supported element
        if (!isSvg && !(isCanvas && "getContext" in el)) {
            return;
        }
        
        var width = Number(el.getAttribute("width")) || el.clientWidth || 0,
            height = Number(el.getAttribute("height")) || el.clientHeight || 0,
            renderer = isSvg ? new SvgRenderer(width, height) : new CanvasRenderer(el.getContext("2d"), width, height),
            size = Math.min(width, height) * (1 - 2 * (padding === undefined ? 0.08 : padding)),
            x = 0 | ((width - size) / 2),
            y = 0 | ((height - size) / 2);
        
        // Draw icon
        iconGenerator(renderer, hash, x, y, size, global);
        
        // SVG needs postprocessing
        if (isSvg) {
            // Parse svg to a temporary span element.
            // Simply using innerHTLM does unfortunately not work on IE.
            var wrapper = document.createElement("span");
            wrapper.innerHTML = renderer.toSvg(false);
            
            // Then replace the content of the target element with the parsed svg.
            while (el.firstChild) {
                el.removeChild(el.firstChild);
            }
            var newNodes = wrapper.firstChild.childNodes;
            while (newNodes.length) {
                el.appendChild(newNodes[0]);
            }
        }
    }
    
    /**
     * Draws an identicon to a context.
     */
    function drawIcon(ctx, hash, size) {
        if (!ctx) {
            throw new Error("No canvas specified.");
        }
        
        var renderer = new CanvasRenderer(ctx, size, size);
        iconGenerator(renderer, hash, 0, 0, size, global);
    }
    
    /**
     * Draws an identicon to a context.
     */
    function toSvg(hash, size) {
        var renderer = new SvgRenderer(size, size);
        iconGenerator(renderer, hash, 0, 0, size, global);
        return renderer.toSvg();
    }

    /**
     * Updates all canvas elements with the data-jdenticon-hash attribute.
     */
    function jdenticon() {
        if (supportsQuerySelectorAll) {
            update("svg[" + HASH_ATTRIBUTE + "],canvas[" + HASH_ATTRIBUTE + "]");
        }
    }
    
    // Public API
    jdenticon["identicon"] = drawIcon;
    jdenticon["toSvg"] = toSvg;
    jdenticon["update"] = update;
    jdenticon["version"] = "{version}";
    
    // Basic jQuery plugin
    if (jQuery) {
        jQuery["fn"]["jdenticon"] = function (hash, padding) {
            this["each"](function (index, el) {
                update(el, hash, padding);
            });
            return this;
        };
    }
    
    // Schedule to render all identicons on the page once it has been loaded.
    if (typeof setTimeout === "function") {
        setTimeout(jdenticon, 0);
    }
    
    return jdenticon;
});
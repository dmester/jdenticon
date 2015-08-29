/**
 * Jdenticon
 * https://github.com/dmester/jdenticon
 * Copyright © Daniel Mester Pirttijärvi
 */

define([
    "./color", 
    "./transform", 
    "./graphics", 
    "./svgRenderer", 
    "./canvasRenderer", 
    "./shapes"], function (
    color,
    Transform,
    Graphics, 
    SvgRenderer, 
    CanvasRenderer, 
    shapes) {
    "use strict";
         
    // <debug>
    var global = window,
        jQuery = window.jQuery;
    // </debug>
    
    var undefined,
		/** @const */
		version = "{version}",
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
        drawIcon(renderer, hash, x, y, size);
        
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
    function drawIconContext(ctx, hash, size) {
        if (!ctx) {
            throw new Error("No canvas specified.");
        }
        
        var renderer = new CanvasRenderer(ctx, size, size);
        drawIcon(renderer, hash, 0, 0, size);
    }
    
    /**
     * Draws an identicon to a context.
     */
    function toSvg(hash, size) {
        var renderer = new SvgRenderer(size, size);
        drawIcon(renderer, hash, 0, 0, size);
        return renderer.toSvg();
    }

    /**
     * Draws an identicon to a context.
     */
    function drawIcon(renderer, hash, x, y, size) {
        // Sizes smaller than 30 px are not supported. If really needed, apply a scaling transformation 
        // to the context before passing it to this function.
        if (size < 30) {
            throw new Error("Jdenticon cannot render identicons smaller than 30 pixels.");
        }
        if (!/^[0-9a-f]{11,}$/i.test(hash)) {
            throw new Error("Invalid hash passed to Jdenticon.");
        }
        
        size = size | 0;
        
        var graphics = new Graphics(renderer);
        
        var cell = (0 | (size / 8)) * 2;
        x += 0 | (size / 2 - cell * 2);
        y += 0 | (size / 2 - cell * 2);

        function renderShape(colorIndex, shapes, index, rotationIndex, positions) {
            var r = rotationIndex ? parseInt(hash.charAt(rotationIndex), 16) : 0,
                shape = shapes[parseInt(hash.charAt(index), 16) % shapes.length],
                i;
            
            renderer.beginShape(availableColors[selectedColorIndexes[colorIndex]]);
            
            for (i = 0; i < positions.length; i++) {
                graphics._transform = new Transform(x + positions[i][0] * cell, y + positions[i][1] * cell, cell, r++ % 4);
                shape(graphics, cell, i);
            }
            
            renderer.endShape();
        }

        // AVAILABLE COLORS
        var hue = parseInt(hash.substr(-7), 16) / 0xfffffff,

            // Available colors for this icon
            availableColors = [
                // Dark gray
                color.rgb(76, 76, 76),
                // Mid color
                color.correctedHsl(hue, 0.5, 0.6),
                // Light gray
                color.rgb(230, 230, 230),
                // Light color
                color.correctedHsl(hue, 0.5, 0.8),
                // Dark color
                color.hsl(hue, 0.5, 0.4)
            ],

            // The index of the selected colors
            selectedColorIndexes = [],
            index;

        function isDuplicate(values) {
            if (values.indexOf(index) >= 0) {
                for (var i = 0; i < values.length; i++) {
                    if (selectedColorIndexes.indexOf(values[i]) >= 0) {
                        return true;
                    }
                }
            }
        }

        for (var i = 0; i < 3; i++) {
            index = parseInt(hash.charAt(8 + i), 16) % availableColors.length;
            if (isDuplicate([0, 4]) || // Disallow dark gray and dark color combo
                isDuplicate([2, 3])) { // Disallow light gray and light color combo
                index = 1;
            }
            selectedColorIndexes.push(index);
        }

        // ACTUAL RENDERING
        // Sides
        renderShape(0, shapes.outer, 2, 3, [[1, 0], [2, 0], [2, 3], [1, 3], [0, 1], [3, 1], [3, 2], [0, 2]]);
        // Corners
        renderShape(1, shapes.outer, 4, 5, [[0, 0], [3, 0], [3, 3], [0, 3]]);
        // Center
        renderShape(2, shapes.center, 1, null, [[1, 1], [2, 1], [2, 2], [1, 2]]);
    };

    /**
     * Updates all canvas elements with the data-jdenticon-hash attribute.
     */
    function jdenticon() {
        if (supportsQuerySelectorAll) {
            update("svg[" + HASH_ATTRIBUTE + "],canvas[" + HASH_ATTRIBUTE + "]");
        }
    }
    jdenticon["drawIcon"] = drawIconContext;
    jdenticon["toSvg"] = toSvg;
    jdenticon["update"] = update;
    jdenticon["version"] = version;
    
    // Basic jQuery plugin
    if (jQuery) {
        jQuery["fn"]["jdenticon"] = function (hash, padding) {
            this["each"](function (index, el) {
                update(el, hash, padding);
            });
            return this;
        };
    }
    
    if (typeof setTimeout === "function") {
        setTimeout(jdenticon, 0);
    }

    return jdenticon;
});
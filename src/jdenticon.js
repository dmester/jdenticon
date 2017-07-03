/**
 * Jdenticon
 * https://github.com/dmester/jdenticon
 * Copyright © Daniel Mester Pirttijärvi
 * 
 * This file contains the public interface of Jdenticon.
 */

define([
    "./iconGenerator", 
    "./svgRenderer", 
    "./svgElement", 
    "./svgWriter", 
    "./canvasRenderer"], function (
    iconGenerator, 
    SvgRenderer, 
    SvgElement, 
    SvgWriter, 
    CanvasRenderer) {
    "use strict";
         
    // <debug>
    var global = window,
        jQuery = window.jQuery;
    // </debug>
    
    var /** @const */
        HASH_ATTRIBUTE = "data-jdenticon-hash",
        supportsQuerySelectorAll = "document" in global && "querySelectorAll" in document;
    
    /**
     * Gets the normalized current Jdenticon color configuration. Missing fields have default values.
     */
    function getCurrentConfig() {
        var configObject = jdenticon["config"] || global["jdenticon_config"] || { },
            lightnessConfig = configObject["lightness"] || { },
            saturation = configObject["saturation"];
        
        /**
         * Creates a lightness range.
         */
        function lightness(configName, defaultMin, defaultMax) {
            var range = lightnessConfig[configName] instanceof Array ? lightnessConfig[configName] : [defaultMin, defaultMax];
            
            /**
             * Gets a lightness relative the specified value in the specified lightness range.
             */
            return function (value) {
                value = range[0] + value * (range[1] - range[0]);
                return value < 0 ? 0 : value > 1 ? 1 : value;
            };
        }
            
        return {
            saturation: typeof saturation == "number" ? saturation : 0.5,
            colorLightness: lightness("color", 0.4, 0.8),
            grayscaleLightness: lightness("grayscale", 0.3, 0.9)
        }
    }
    
    /**
     * Updates the identicon in the specified canvas or svg elements.
     * @param {string=} hash Optional hash to be rendered. If not specified, the hash specified by the data-jdenticon-hash is used.
     * @param {number=} padding Optional padding in percents. Extra padding might be added to center the rendered identicon.
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
        
        var renderer = isSvg ? 
            new SvgRenderer(new SvgElement(el)) : 
            new CanvasRenderer(el.getContext("2d"));
        
        // Draw icon
        iconGenerator(renderer, hash, 0, 0, renderer.size, padding, getCurrentConfig());
    }
    
    /**
     * Draws an identicon to a context.
     */
    function drawIcon(ctx, hash, size) {
        if (!ctx) {
            throw new Error("No canvas specified.");
        }
        
        var renderer = new CanvasRenderer(ctx, size);
        iconGenerator(renderer, hash, 0, 0, size, 0, getCurrentConfig());
    }
    
    /**
     * Draws an identicon to a context.
     * @param {number=} padding Optional padding in percents. Extra padding might be added to center the rendered identicon.
     */
    function toSvg(hash, size, padding) {
        var writer = new SvgWriter(size);
        var renderer = new SvgRenderer(writer);
        iconGenerator(renderer, hash, 0, 0, size, padding, getCurrentConfig());
        return writer.toString();
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
    jdenticon["drawIcon"] = drawIcon;
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
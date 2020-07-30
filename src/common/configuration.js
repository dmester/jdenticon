/**
 * Jdenticon
 * https://github.com/dmester/jdenticon
 * Copyright © Daniel Mester Pirttijärvi
 */

import { parseColor } from "../renderer/color";
import { GLOBAL } from "./global";

/**
 * @noinline
 */
const ROOT_CONFIG_PROPERTY = "config";

var rootConfigurationHolder = {};

/**
 * Defines the deprecated `config` property on the root Jdenticon object. When the property is set a warning is 
 * printed in the console. To minimize bundle size, this is only used in Node bundles.
 * @param {!Object} rootObject 
 */
export function defineConfigPropertyWithWarn(rootObject) {
    Object.defineProperty(rootObject, "config", {
        configurable: true,
        get: () => rootConfigurationHolder[ROOT_CONFIG_PROPERTY],
        set: newConfiguration => {
            rootConfigurationHolder[ROOT_CONFIG_PROPERTY] = newConfiguration;
            console.warn("jdenticon.config is deprecated. Use jdenticon.configure() instead.");
        },
    });
}

/**
 * Defines the deprecated `config` property on the root Jdenticon object without printing a warning in the console
 * when it is being used.
 * @param {!Object} rootObject 
 */
export function defineConfigProperty(rootObject) {
    rootConfigurationHolder = rootObject;
}

/**
 * Sets a new icon style configuration. The new configuration is not merged with the previous one. * 
 * @param {Object} newConfiguration - New configuration object.
 */
export function configure(newConfiguration) {
    if (arguments.length) {
        rootConfigurationHolder[ROOT_CONFIG_PROPERTY] = newConfiguration;
    }
    return rootConfigurationHolder[ROOT_CONFIG_PROPERTY];
}

/**
 * Gets the normalized current Jdenticon color configuration. Missing fields have default values.
 * @param {Object|number|undefined} paddingOrLocalConfig - Configuration passed to the called API method. A
 *    local configuration overrides the global configuration in it entirety. This parameter can for backward
 *    compatibility also contain a padding value. A padding value only overrides the global padding, not the
 *    entire global configuration.
 * @param {number} defaultPadding - Padding used if no padding is specified in neither the configuration nor
 *    explicitly to the API method.
 */
export function getConfiguration(paddingOrLocalConfig, defaultPadding) {
    const configObject = 
            typeof paddingOrLocalConfig == "object" && paddingOrLocalConfig ||
            rootConfigurationHolder[ROOT_CONFIG_PROPERTY] ||
            GLOBAL["jdenticon_config"] ||
            { },

        lightnessConfig = configObject["lightness"] || { },
        
        // In versions < 2.1.0 there was no grayscale saturation -
        // saturation was the color saturation.
        saturation = configObject["saturation"] || { },
        colorSaturation = "color" in saturation ? saturation["color"] : saturation,
        grayscaleSaturation = saturation["grayscale"],

        backColor = configObject["backColor"],
        padding = configObject["padding"];
    
    /**
     * Creates a lightness range.
     */
    function lightness(configName, defaultRange) {
        let range = lightnessConfig[configName];
        
        // Check if the lightness range is an array-like object. This way we ensure the
        // array contain two values at the same time.
        if (!(range && range.length > 1)) {
            range = defaultRange;
        }

        /**
         * Gets a lightness relative the specified value in the specified lightness range.
         */
        return function (value) {
            value = range[0] + value * (range[1] - range[0]);
            return value < 0 ? 0 : value > 1 ? 1 : value;
        };
    }

    /**
     * Gets a hue allowed by the configured hue restriction,
     * provided the originally computed hue.
     */
    function hueFunction(originalHue) {
        const hueConfig = configObject["hues"];
        let hue;
        
        // Check if 'hues' is an array-like object. This way we also ensure that
        // the array is not empty, which would mean no hue restriction.
        if (hueConfig && hueConfig.length > 0) {
            // originalHue is in the range [0, 1]
            // Multiply with 0.999 to change the range to [0, 1) and then truncate the index.
            hue = hueConfig[0 | (0.999 * originalHue * hueConfig.length)];
        }

        return typeof hue == "number" ?
            
            // A hue was specified. We need to convert the hue from
            // degrees on any turn - e.g. 746° is a perfectly valid hue -
            // to turns in the range [0, 1).
            ((((hue / 360) % 1) + 1) % 1) :

            // No hue configured => use original hue
            originalHue;
    }
        
    return {
        hue: hueFunction,
        colorSaturation: typeof colorSaturation == "number" ? colorSaturation : 0.5,
        grayscaleSaturation: typeof grayscaleSaturation == "number" ? grayscaleSaturation : 0,
        colorLightness: lightness("color", [0.4, 0.8]),
        grayscaleLightness: lightness("grayscale", [0.3, 0.9]),
        backColor: parseColor(backColor),
        iconPadding: 
            typeof paddingOrLocalConfig == "number" ? paddingOrLocalConfig : 
            typeof padding == "number" ? padding : 
            defaultPadding
    }
}

/**
 * Jdenticon 3.1.0
 * http://jdenticon.com
 *
 * Built: 2020-12-12T13:51:48.709Z
 * 
 * MIT License
 * 
 * Copyright (c) 2014-2020 Daniel Mester Pirttijärvi
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import canvasRenderer from 'canvas-renderer';

/**
 * Parses a substring of the hash as a number.
 * @param {number} startPosition 
 * @param {number=} octets
 */
function parseHex(hash, startPosition, octets) {
    return parseInt(hash.substr(startPosition, octets), 16);
}

function decToHex(v) {
    v |= 0; // Ensure integer value
    return v < 0 ? "00" :
        v < 16 ? "0" + v.toString(16) :
        v < 256 ? v.toString(16) :
        "ff";
}

function hueToRgb(m1, m2, h) {
    h = h < 0 ? h + 6 : h > 6 ? h - 6 : h;
    return decToHex(255 * (
        h < 1 ? m1 + (m2 - m1) * h :
        h < 3 ? m2 :
        h < 4 ? m1 + (m2 - m1) * (4 - h) :
        m1));
}

/**
 * @param {string} color  Color value to parse. Currently hexadecimal strings on the format #rgb[a] and #rrggbb[aa] are supported.
 * @returns {string}
 */
function parseColor(color) {
    if (/^#[0-9a-f]{3,8}$/i.test(color)) {
        let result;
        const colorLength = color.length;

        if (colorLength < 6) {
            const r = color[1],
                  g = color[2],
                  b = color[3],
                  a = color[4] || "";
            result = "#" + r + r + g + g + b + b + a + a;
        }
        if (colorLength == 7 || colorLength > 8) {
            result = color;
        }
        
        return result;
    }
}

/**
 * Converts a hexadecimal color to a CSS3 compatible color.
 * @param {string} hexColor  Color on the format "#RRGGBB" or "#RRGGBBAA"
 * @returns {string}
 */
function toCss3Color(hexColor) {
    const a = parseHex(hexColor, 7, 2);
    let result;

    if (isNaN(a)) {
        result = hexColor;
    } else {
        const r = parseHex(hexColor, 1, 2),
            g = parseHex(hexColor, 3, 2),
            b = parseHex(hexColor, 5, 2);
        result = "rgba(" + r + "," + g + "," + b + "," + (a / 255).toFixed(2) + ")";
    }

    return result;
}

/**
 * Converts an HSL color to a hexadecimal RGB color.
 * @param {number} hue  Hue in range [0, 1]
 * @param {number} saturation  Saturation in range [0, 1]
 * @param {number} lightness  Lightness in range [0, 1]
 * @returns {string}
 */
function hsl(hue, saturation, lightness) {
    // Based on http://www.w3.org/TR/2011/REC-css3-color-20110607/#hsl-color
    let result;

    if (saturation == 0) {
        const partialHex = decToHex(lightness * 255);
        result = partialHex + partialHex + partialHex;
    }
    else {
        const m2 = lightness <= 0.5 ? lightness * (saturation + 1) : lightness + saturation - lightness * saturation,
              m1 = lightness * 2 - m2;
        result =
            hueToRgb(m1, m2, hue * 6 + 2) +
            hueToRgb(m1, m2, hue * 6) +
            hueToRgb(m1, m2, hue * 6 - 2);
    }

    return "#" + result;
}

/**
 * Converts an HSL color to a hexadecimal RGB color. This function will correct the lightness for the "dark" hues
 * @param {number} hue  Hue in range [0, 1]
 * @param {number} saturation  Saturation in range [0, 1]
 * @param {number} lightness  Lightness in range [0, 1]
 * @returns {string}
 */
function correctedHsl(hue, saturation, lightness) {
    // The corrector specifies the perceived middle lightness for each hue
    const correctors = [ 0.55, 0.5, 0.5, 0.46, 0.6, 0.55, 0.55 ],
          corrector = correctors[(hue * 6 + 0.5) | 0];
    
    // Adjust the input lightness relative to the corrector
    lightness = lightness < 0.5 ? lightness * corrector * 2 : corrector + (lightness - 0.5) * (1 - corrector) * 2;
    
    return hsl(hue, saturation, lightness);
}

// In the future we can replace `GLOBAL` with `globalThis`, but for now use the old school global detection for
// backward compatibility.

const GLOBAL = 
    typeof window !== "undefined" ? window :
    typeof self !== "undefined" ? self :
    typeof global !== "undefined" ? global :
    {};

/**
 * @typedef {Object} ParsedConfiguration
 * @property {number} colorSaturation
 * @property {number} grayscaleSaturation
 * @property {string} backColor
 * @property {number} iconPadding
 * @property {function(number):number} hue
 * @property {function(number):number} colorLightness
 * @property {function(number):number} grayscaleLightness
 */

const CONFIG_PROPERTIES = {
    GLOBAL: "jdenticon_config",
    MODULE: "config",
};

var rootConfigurationHolder = {};

/**
 * Sets a new icon style configuration. The new configuration is not merged with the previous one. * 
 * @param {Object} newConfiguration - New configuration object.
 */
function configure(newConfiguration) {
    if (arguments.length) {
        rootConfigurationHolder[CONFIG_PROPERTIES.MODULE] = newConfiguration;
    }
    return rootConfigurationHolder[CONFIG_PROPERTIES.MODULE];
}

/**
 * Gets the normalized current Jdenticon color configuration. Missing fields have default values.
 * @param {Object|number|undefined} paddingOrLocalConfig - Configuration passed to the called API method. A
 *    local configuration overrides the global configuration in it entirety. This parameter can for backward
 *    compatibility also contain a padding value. A padding value only overrides the global padding, not the
 *    entire global configuration.
 * @param {number} defaultPadding - Padding used if no padding is specified in neither the configuration nor
 *    explicitly to the API method.
 * @returns {ParsedConfiguration}
 */
function getConfiguration(paddingOrLocalConfig, defaultPadding) {
    const configObject = 
            typeof paddingOrLocalConfig == "object" && paddingOrLocalConfig ||
            rootConfigurationHolder[CONFIG_PROPERTIES.MODULE] ||
            GLOBAL[CONFIG_PROPERTIES.GLOBAL] ||
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

/**
 * Represents a point.
 */
class Point {
    /**
     * @param {number} x 
     * @param {number} y 
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

/**
 * Translates and rotates a point before being passed on to the canvas context. This was previously done by the canvas context itself, 
 * but this caused a rendering issue in Chrome on sizes > 256 where the rotation transformation of inverted paths was not done properly.
 */
class Transform {
    /**
     * @param {number} x The x-coordinate of the upper left corner of the transformed rectangle.
     * @param {number} y The y-coordinate of the upper left corner of the transformed rectangle.
     * @param {number} size The size of the transformed rectangle.
     * @param {number} rotation Rotation specified as 0 = 0 rad, 1 = 0.5π rad, 2 = π rad, 3 = 1.5π rad
     */
    constructor(x, y, size, rotation) {
        this._x = x;
        this._y = y;
        this._size = size;
        this._rotation = rotation;
    }

    /**
     * Transforms the specified point based on the translation and rotation specification for this Transform.
     * @param {number} x x-coordinate
     * @param {number} y y-coordinate
     * @param {number=} w The width of the transformed rectangle. If greater than 0, this will ensure the returned point is of the upper left corner of the transformed rectangle.
     * @param {number=} h The height of the transformed rectangle. If greater than 0, this will ensure the returned point is of the upper left corner of the transformed rectangle.
     */
    transformIconPoint(x, y, w, h) {
        const right = this._x + this._size,
              bottom = this._y + this._size,
              rotation = this._rotation;
        return rotation === 1 ? new Point(right - y - (h || 0), this._y + x) :
               rotation === 2 ? new Point(right - x - (w || 0), bottom - y - (h || 0)) :
               rotation === 3 ? new Point(this._x + y, bottom - x - (w || 0)) :
               new Point(this._x + x, this._y + y);
    }
}

const NO_TRANSFORM = new Transform(0, 0, 0, 0);



/**
 * Provides helper functions for rendering common basic shapes.
 */
class Graphics {
    /**
     * @param {Renderer} renderer 
     */
    constructor(renderer) {
        /**
         * @type {Renderer}
         * @private
         */
        this._renderer = renderer;

        /**
         * @type {Transform}
         */
        this.currentTransform = NO_TRANSFORM;
    }

    /**
     * Adds a polygon to the underlying renderer.
     * @param {Array<number>} points The points of the polygon clockwise on the format [ x0, y0, x1, y1, ..., xn, yn ]
     * @param {boolean=} invert Specifies if the polygon will be inverted.
     */
    addPolygon(points, invert) {
        const di = invert ? -2 : 2,
              transformedPoints = [];
        
        for (let i = invert ? points.length - 2 : 0; i < points.length && i >= 0; i += di) {
            transformedPoints.push(this.currentTransform.transformIconPoint(points[i], points[i + 1]));
        }
        
        this._renderer.addPolygon(transformedPoints);
    }
    
    /**
     * Adds a polygon to the underlying renderer.
     * Source: http://stackoverflow.com/a/2173084
     * @param {number} x The x-coordinate of the upper left corner of the rectangle holding the entire ellipse.
     * @param {number} y The y-coordinate of the upper left corner of the rectangle holding the entire ellipse.
     * @param {number} size The size of the ellipse.
     * @param {boolean=} invert Specifies if the ellipse will be inverted.
     */
    addCircle(x, y, size, invert) {
        const p = this.currentTransform.transformIconPoint(x, y, size, size);
        this._renderer.addCircle(p, size, invert);
    }

    /**
     * Adds a rectangle to the underlying renderer.
     * @param {number} x The x-coordinate of the upper left corner of the rectangle.
     * @param {number} y The y-coordinate of the upper left corner of the rectangle.
     * @param {number} w The width of the rectangle.
     * @param {number} h The height of the rectangle.
     * @param {boolean=} invert Specifies if the rectangle will be inverted.
     */
    addRectangle(x, y, w, h, invert) {
        this.addPolygon([
            x, y, 
            x + w, y,
            x + w, y + h,
            x, y + h
        ], invert);
    }

    /**
     * Adds a right triangle to the underlying renderer.
     * @param {number} x The x-coordinate of the upper left corner of the rectangle holding the triangle.
     * @param {number} y The y-coordinate of the upper left corner of the rectangle holding the triangle.
     * @param {number} w The width of the triangle.
     * @param {number} h The height of the triangle.
     * @param {number} r The rotation of the triangle (clockwise). 0 = right corner of the triangle in the lower left corner of the bounding rectangle.
     * @param {boolean=} invert Specifies if the triangle will be inverted.
     */
    addTriangle(x, y, w, h, r, invert) {
        const points = [
            x + w, y, 
            x + w, y + h, 
            x, y + h,
            x, y
        ];
        points.splice(((r || 0) % 4) * 2, 2);
        this.addPolygon(points, invert);
    }

    /**
     * Adds a rhombus to the underlying renderer.
     * @param {number} x The x-coordinate of the upper left corner of the rectangle holding the rhombus.
     * @param {number} y The y-coordinate of the upper left corner of the rectangle holding the rhombus.
     * @param {number} w The width of the rhombus.
     * @param {number} h The height of the rhombus.
     * @param {boolean=} invert Specifies if the rhombus will be inverted.
     */
    addRhombus(x, y, w, h, invert) {
        this.addPolygon([
            x + w / 2, y,
            x + w, y + h / 2,
            x + w / 2, y + h,
            x, y + h / 2
        ], invert);
    }
}

/**
 * @param {number} index
 * @param {Graphics} g
 * @param {number} cell
 * @param {number} positionIndex
 */
function centerShape(index, g, cell, positionIndex) {
    index = index % 14;

    let k, m, w, h, inner, outer;

    !index ? (
        k = cell * 0.42,
        g.addPolygon([
            0, 0,
            cell, 0,
            cell, cell - k * 2,
            cell - k, cell,
            0, cell
        ])) :

    index == 1 ? (
        w = 0 | (cell * 0.5), 
        h = 0 | (cell * 0.8),

        g.addTriangle(cell - w, 0, w, h, 2)) :

    index == 2 ? (
        w = 0 | (cell / 3),
        g.addRectangle(w, w, cell - w, cell - w)) :

    index == 3 ? (
        inner = cell * 0.1,
        // Use fixed outer border widths in small icons to ensure the border is drawn
        outer = 
            cell < 6 ? 1 :
            cell < 8 ? 2 :
            (0 | (cell * 0.25)),
        
        inner = 
            inner > 1 ? (0 | inner) : // large icon => truncate decimals
            inner > 0.5 ? 1 :         // medium size icon => fixed width
            inner,                    // small icon => anti-aliased border

        g.addRectangle(outer, outer, cell - inner - outer, cell - inner - outer)) :

    index == 4 ? (
        m = 0 | (cell * 0.15),
        w = 0 | (cell * 0.5),
        g.addCircle(cell - w - m, cell - w - m, w)) :

    index == 5 ? (
        inner = cell * 0.1,
        outer = inner * 4,

        // Align edge to nearest pixel in large icons
        outer > 3 && (outer = 0 | outer),
        
        g.addRectangle(0, 0, cell, cell),
        g.addPolygon([
            outer, outer,
            cell - inner, outer,
            outer + (cell - outer - inner) / 2, cell - inner
        ], true)) :

    index == 6 ? 
        g.addPolygon([
            0, 0,
            cell, 0,
            cell, cell * 0.7,
            cell * 0.4, cell * 0.4,
            cell * 0.7, cell,
            0, cell
        ]) :

    index == 7 ? 
        g.addTriangle(cell / 2, cell / 2, cell / 2, cell / 2, 3) :

    index == 8 ? (
        g.addRectangle(0, 0, cell, cell / 2),
        g.addRectangle(0, cell / 2, cell / 2, cell / 2),
        g.addTriangle(cell / 2, cell / 2, cell / 2, cell / 2, 1)) :

    index == 9 ? (
        inner = cell * 0.14,
        // Use fixed outer border widths in small icons to ensure the border is drawn
        outer = 
            cell < 4 ? 1 :
            cell < 6 ? 2 :
            (0 | (cell * 0.35)),

        inner = 
            cell < 8 ? inner : // small icon => anti-aliased border
            (0 | inner),       // large icon => truncate decimals

        g.addRectangle(0, 0, cell, cell),
        g.addRectangle(outer, outer, cell - outer - inner, cell - outer - inner, true)) :

    index == 10 ? (
        inner = cell * 0.12,
        outer = inner * 3,

        g.addRectangle(0, 0, cell, cell),
        g.addCircle(outer, outer, cell - inner - outer, true)) :

    index == 11 ? 
        g.addTriangle(cell / 2, cell / 2, cell / 2, cell / 2, 3) :

    index == 12 ? (
        m = cell * 0.25,
        g.addRectangle(0, 0, cell, cell),
        g.addRhombus(m, m, cell - m, cell - m, true)) :

    // 13
    (
        !positionIndex && (
            m = cell * 0.4, w = cell * 1.2,
            g.addCircle(m, m, w)
        )
    );
}

/**
 * @param {number} index
 * @param {Graphics} g
 * @param {number} cell
 */
function outerShape(index, g, cell) {
    index = index % 4;

    let m;

    !index ?
        g.addTriangle(0, 0, cell, cell, 0) :
        
    index == 1 ?
        g.addTriangle(0, cell / 2, cell, cell / 2, 0) :

    index == 2 ?
        g.addRhombus(0, 0, cell, cell) :

    // 3
    (
        m = cell / 6,
        g.addCircle(m, m, cell - 2 * m)
    );
}

/**
 * Gets a set of identicon color candidates for a specified hue and config.
 * @param {number} hue
 * @param {ParsedConfiguration} config
 */
function colorTheme(hue, config) {
    hue = config.hue(hue);
    return [
        // Dark gray
        correctedHsl(hue, config.grayscaleSaturation, config.grayscaleLightness(0)),
        // Mid color
        correctedHsl(hue, config.colorSaturation, config.colorLightness(0.5)),
        // Light gray
        correctedHsl(hue, config.grayscaleSaturation, config.grayscaleLightness(1)),
        // Light color
        correctedHsl(hue, config.colorSaturation, config.colorLightness(1)),
        // Dark color
        correctedHsl(hue, config.colorSaturation, config.colorLightness(0))
    ];
}

/**
 * Draws an identicon to a specified renderer.
 * @param {Renderer} renderer
 * @param {string} hash
 * @param {Object|number=} config
 */
function iconGenerator(renderer, hash, config) {
    const parsedConfig = getConfiguration(config, 0.08);

    // Set background color
    if (parsedConfig.backColor) {
        renderer.setBackground(parsedConfig.backColor);
    }
    
    // Calculate padding and round to nearest integer
    let size = renderer.iconSize;
    const padding = (0.5 + size * parsedConfig.iconPadding) | 0;
    size -= padding * 2;
    
    const graphics = new Graphics(renderer);
    
    // Calculate cell size and ensure it is an integer
    const cell = 0 | (size / 4);
    
    // Since the cell size is integer based, the actual icon will be slightly smaller than specified => center icon
    const x = 0 | (padding + size / 2 - cell * 2);
    const y = 0 | (padding + size / 2 - cell * 2);

    function renderShape(colorIndex, shapes, index, rotationIndex, positions) {
        const shapeIndex = parseHex(hash, index, 1);
        let r = rotationIndex ? parseHex(hash, rotationIndex, 1) : 0;
        
        renderer.beginShape(availableColors[selectedColorIndexes[colorIndex]]);
        
        for (let i = 0; i < positions.length; i++) {
            graphics.currentTransform = new Transform(x + positions[i][0] * cell, y + positions[i][1] * cell, cell, r++ % 4);
            shapes(shapeIndex, graphics, cell, i);
        }
        
        renderer.endShape();
    }

    // AVAILABLE COLORS
    const hue = parseHex(hash, -7) / 0xfffffff,
    
          // Available colors for this icon
          availableColors = colorTheme(hue, parsedConfig),

          // The index of the selected colors
          selectedColorIndexes = [];

    let index;

    function isDuplicate(values) {
        if (values.indexOf(index) >= 0) {
            for (let i = 0; i < values.length; i++) {
                if (selectedColorIndexes.indexOf(values[i]) >= 0) {
                    return true;
                }
            }
        }
    }

    for (let i = 0; i < 3; i++) {
        index = parseHex(hash, 8 + i, 1) % availableColors.length;
        if (isDuplicate([0, 4]) || // Disallow dark gray and dark color combo
            isDuplicate([2, 3])) { // Disallow light gray and light color combo
            index = 1;
        }
        selectedColorIndexes.push(index);
    }

    // ACTUAL RENDERING
    // Sides
    renderShape(0, outerShape, 2, 3, [[1, 0], [2, 0], [2, 3], [1, 3], [0, 1], [3, 1], [3, 2], [0, 2]]);
    // Corners
    renderShape(1, outerShape, 4, 5, [[0, 0], [3, 0], [3, 3], [0, 3]]);
    // Center
    renderShape(2, centerShape, 1, null, [[1, 1], [2, 1], [2, 2], [1, 2]]);
    
    renderer.finish();
}

/**
 * Computes a SHA1 hash for any value and returns it as a hexadecimal string.
 * 
 * This function is optimized for minimal code size and rather short messages.
 * 
 * @param {string} message 
 */
function sha1(message) {
    const HASH_SIZE_HALF_BYTES = 40;
    const BLOCK_SIZE_WORDS = 16;

    // Variables
    // `var` is used to be able to minimize the number of `var` keywords.
    var i = 0,
        f = 0,
    
        // Use `encodeURI` to UTF8 encode the message without any additional libraries
        // We could use `unescape` + `encodeURI` to minimize the code, but that would be slightly risky
        // since `unescape` is deprecated.
        urlEncodedMessage = encodeURI(message) + "%80", // trailing '1' bit padding
        
        // This can be changed to a preallocated Uint32Array array for greater performance and larger code size
        data = [],
        dataSize,
        
        hashBuffer = [],

        a = 0x67452301,
        b = 0xefcdab89,
        c = ~a,
        d = ~b,
        e = 0xc3d2e1f0,
        hash = [a, b, c, d, e],

        blockStartIndex = 0,
        hexHash = "";

    /**
     * Rotates the value a specified number of bits to the left.
     * @param {number} value  Value to rotate
     * @param {number} shift  Bit count to shift.
     */
    function rotl(value, shift) {
        return (value << shift) | (value >>> (32 - shift));
    }

    // Message data
    for ( ; i < urlEncodedMessage.length; f++) {
        data[f >> 2] = data[f >> 2] |
            (
                (
                    urlEncodedMessage[i] == "%"
                        // Percent encoded byte
                        ? parseInt(urlEncodedMessage.substring(i + 1, i += 3), 16)
                        // Unencoded byte
                        : urlEncodedMessage.charCodeAt(i++)
                )

                // Read bytes in reverse order (big endian words)
                << ((3 - (f & 3)) * 8)
            );
    }

    // f is now the length of the utf8 encoded message
    // 7 = 8 bytes (64 bit) for message size, -1 to round down
    // >> 6 = integer division with block size
    dataSize = (((f + 7) >> 6) + 1) * BLOCK_SIZE_WORDS;

    // Message size in bits.
    // SHA1 uses a 64 bit integer to represent the size, but since we only support short messages only the least
    // significant 32 bits are set. -8 is for the '1' bit padding byte.
    data[dataSize - 1] = f * 8 - 8;
    
    // Compute hash
    for ( ; blockStartIndex < dataSize; blockStartIndex += BLOCK_SIZE_WORDS) {
        for (i = 0; i < 80; i++) {
            f = rotl(a, 5) + e + (
                    // Ch
                    i < 20 ? ((b & c) ^ ((~b) & d)) + 0x5a827999 :
                    
                    // Parity
                    i < 40 ? (b ^ c ^ d) + 0x6ed9eba1 :
                    
                    // Maj
                    i < 60 ? ((b & c) ^ (b & d) ^ (c & d)) + 0x8f1bbcdc :
                    
                    // Parity
                    (b ^ c ^ d) + 0xca62c1d6
                ) + ( 
                    hashBuffer[i] = i < BLOCK_SIZE_WORDS
                        // Bitwise OR is used to coerse `undefined` to 0
                        ? (data[blockStartIndex + i] | 0)
                        : rotl(hashBuffer[i - 3] ^ hashBuffer[i - 8] ^ hashBuffer[i - 14] ^ hashBuffer[i - 16], 1)
                );

            e = d;
            d = c;
            c = rotl(b, 30);
            b = a;
            a = f;
        }

        hash[0] = a = ((hash[0] + a) | 0);
        hash[1] = b = ((hash[1] + b) | 0);
        hash[2] = c = ((hash[2] + c) | 0);
        hash[3] = d = ((hash[3] + d) | 0);
        hash[4] = e = ((hash[4] + e) | 0);
    }

    // Format hex hash
    for (i = 0; i < HASH_SIZE_HALF_BYTES; i++) {
        hexHash += (
            (
                // Get word (2^3 half-bytes per word)
                hash[i >> 3] >>>

                // Append half-bytes in reverse order
                ((7 - (i & 7)) * 4)
            ) 
            // Clamp to half-byte
            & 0xf
        ).toString(16);
    }

    return hexHash;
}

/**
 * Inputs a value that might be a valid hash string for Jdenticon and returns it 
 * if it is determined valid, otherwise a falsy value is returned.
 */
function isValidHash(hashCandidate) {
    return /^[0-9a-f]{11,}$/i.test(hashCandidate) && hashCandidate;
}

/**
 * Computes a hash for the specified value. Currently SHA1 is used. This function
 * always returns a valid hash.
 */
function computeHash(value) {
    return sha1(value == null ? "" : "" + value);
}



/**
 * Renderer redirecting drawing commands to a canvas context.
 * @implements {Renderer}
 */
class CanvasRenderer {
    /**
     * @param {number=} iconSize
     */
    constructor(ctx, iconSize) {
        const canvas = ctx.canvas; 
        const width = canvas.width;
        const height = canvas.height;
        
        ctx.save();
        
        if (!iconSize) {
            iconSize = Math.min(width, height);
            
            ctx.translate(
                ((width - iconSize) / 2) | 0,
                ((height - iconSize) / 2) | 0);
        }

        /**
         * @private
         */
        this._ctx = ctx;
        this.iconSize = iconSize;
        
        ctx.clearRect(0, 0, iconSize, iconSize);
    }

    /**
     * Fills the background with the specified color.
     * @param {string} fillColor  Fill color on the format #rrggbb[aa].
     */
    setBackground(fillColor) {
        const ctx = this._ctx;
        const iconSize = this.iconSize;

        ctx.fillStyle = toCss3Color(fillColor);
        ctx.fillRect(0, 0, iconSize, iconSize);
    }

    /**
     * Marks the beginning of a new shape of the specified color. Should be ended with a call to endShape.
     * @param {string} fillColor Fill color on format #rrggbb[aa].
     */
    beginShape(fillColor) {
        const ctx = this._ctx;
        ctx.fillStyle = toCss3Color(fillColor);
        ctx.beginPath();
    }

    /**
     * Marks the end of the currently drawn shape. This causes the queued paths to be rendered on the canvas.
     */
    endShape() {
        this._ctx.fill();
    }

    /**
     * Adds a polygon to the rendering queue.
     * @param points An array of Point objects.
     */
    addPolygon(points) {
        const ctx = this._ctx;
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.closePath();
    }

    /**
     * Adds a circle to the rendering queue.
     * @param {Point} point The upper left corner of the circle bounding box.
     * @param {number} diameter The diameter of the circle.
     * @param {boolean} counterClockwise True if the circle is drawn counter-clockwise (will result in a hole if rendered on a clockwise path).
     */
    addCircle(point, diameter, counterClockwise) {
        const ctx = this._ctx,
              radius = diameter / 2;
        ctx.moveTo(point.x + radius, point.y + radius);
        ctx.arc(point.x + radius, point.y + radius, radius, 0, Math.PI * 2, counterClockwise);
        ctx.closePath();
    }

    /**
     * Called when the icon has been completely drawn.
     */
    finish() {
        this._ctx.restore();
    }
}

/**
 * Draws an identicon to a context.
 * @param {CanvasRenderingContext2D} ctx - Canvas context on which the icon will be drawn at location (0, 0).
 * @param {*} hashOrValue - A hexadecimal hash string or any value that will be hashed by Jdenticon.
 * @param {number} size - Icon size in pixels.
 * @param {Object|number=} config - Optional configuration. If specified, this configuration object overrides any
 *    global configuration in its entirety. For backward compatibility a padding value in the range [0.0, 0.5) can be
 *    specified in place of a configuration object.
 */
function drawIcon(ctx, hashOrValue, size, config) {
    if (!ctx) {
        throw new Error("No canvas specified.");
    }
    
    iconGenerator(new CanvasRenderer(ctx, size), 
        isValidHash(hashOrValue) || computeHash(hashOrValue), 
        config);
}

/**
 * Draws an identicon as PNG.
 * @param {*} hashOrValue - A hexadecimal hash string or any value that will be hashed by Jdenticon.
 * @param {number} size - Icon size in pixels.
 * @param {Object|number=} config - Optional configuration. If specified, this configuration object overrides any
 *    global configuration in its entirety. For backward compatibility a padding value in the range [0.0, 0.5) can be
 *    specified in place of a configuration object.
 * @returns {Buffer} PNG data
 */
function toPng(hashOrValue, size, config) {
    const canvas = canvasRenderer.createCanvas(size, size);
    const ctx = canvas.getContext("2d");
    
    iconGenerator(new CanvasRenderer(ctx, size), 
        isValidHash(hashOrValue) || computeHash(hashOrValue), 
        config);
    
    return canvas.toPng({ "Software": "Jdenticon" });
}

/**
 * Prepares a measure to be used as a measure in an SVG path, by
 * rounding the measure to a single decimal. This reduces the file
 * size of the generated SVG with more than 50% in some cases.
 */
function svgValue(value) {
    return ((value * 10 + 0.5) | 0) / 10;
}

/**
 * Represents an SVG path element.
 */
class SvgPath {
    constructor() {
        /**
         * This property holds the data string (path.d) of the SVG path.
         * @type {string}
         */
        this.dataString = "";
    }

    /**
     * Adds a polygon with the current fill color to the SVG path.
     * @param points An array of Point objects.
     */
    addPolygon(points) {
        let dataString = "";
        for (let i = 0; i < points.length; i++) {
            dataString += (i ? "L" : "M") + svgValue(points[i].x) + " " + svgValue(points[i].y);
        }
        this.dataString += dataString + "Z";
    }

    /**
     * Adds a circle with the current fill color to the SVG path.
     * @param {Point} point The upper left corner of the circle bounding box.
     * @param {number} diameter The diameter of the circle.
     * @param {boolean} counterClockwise True if the circle is drawn counter-clockwise (will result in a hole if rendered on a clockwise path).
     */
    addCircle(point, diameter, counterClockwise) {
        const sweepFlag = counterClockwise ? 0 : 1,
              svgRadius = svgValue(diameter / 2),
              svgDiameter = svgValue(diameter),
              svgArc = "a" + svgRadius + "," + svgRadius + " 0 1," + sweepFlag + " ";
            
        this.dataString += 
            "M" + svgValue(point.x) + " " + svgValue(point.y + diameter / 2) +
            svgArc + svgDiameter + ",0" + 
            svgArc + (-svgDiameter) + ",0";
    }
}



/**
 * Renderer producing SVG output.
 * @implements {Renderer}
 */
class SvgRenderer {
    /**
     * @param {SvgElement|SvgWriter} target 
     */
    constructor(target) {
        /**
         * @type {SvgPath}
         * @private
         */
        this._path;

        /**
         * @type {Object.<string,SvgPath>}
         * @private
         */
        this._pathsByColor = { };

        /**
         * @type {SvgElement|SvgWriter}
         * @private
         */
        this._target = target;

        /**
         * @type {number}
         */
        this.iconSize = target.iconSize;
    }

    /**
     * Fills the background with the specified color.
     * @param {string} fillColor  Fill color on the format #rrggbb[aa].
     */
    setBackground(fillColor) {
        const match = /^(#......)(..)?/.exec(fillColor),
              opacity = match[2] ? parseHex(match[2], 0) / 255 : 1;
        this._target.setBackground(match[1], opacity);
    }

    /**
     * Marks the beginning of a new shape of the specified color. Should be ended with a call to endShape.
     * @param {string} color Fill color on format #xxxxxx.
     */
    beginShape(color) {
        this._path = this._pathsByColor[color] || (this._pathsByColor[color] = new SvgPath());
    }

    /**
     * Marks the end of the currently drawn shape.
     */
    endShape() { }

    /**
     * Adds a polygon with the current fill color to the SVG.
     * @param points An array of Point objects.
     */
    addPolygon(points) {
        this._path.addPolygon(points);
    }

    /**
     * Adds a circle with the current fill color to the SVG.
     * @param {Point} point The upper left corner of the circle bounding box.
     * @param {number} diameter The diameter of the circle.
     * @param {boolean} counterClockwise True if the circle is drawn counter-clockwise (will result in a hole if rendered on a clockwise path).
     */
    addCircle(point, diameter, counterClockwise) {
        this._path.addCircle(point, diameter, counterClockwise);
    }

    /**
     * Called when the icon has been completely drawn.
     */
    finish() { 
        const pathsByColor = this._pathsByColor;
        for (let color in pathsByColor) {
            // hasOwnProperty cannot be shadowed in pathsByColor
            // eslint-disable-next-line no-prototype-builtins
            if (pathsByColor.hasOwnProperty(color)) {
                this._target.appendPath(color, pathsByColor[color].dataString);
            }
        }
    }
}

const SVG_CONSTANTS = {
    XMLNS: "http://www.w3.org/2000/svg",
    WIDTH: "width",
    HEIGHT: "height",
};

/**
 * Renderer producing SVG output.
 */
class SvgWriter {
    /**
     * @param {number} iconSize - Icon width and height in pixels.
     */
    constructor(iconSize) {
        /**
         * @type {number}
         */
        this.iconSize = iconSize;

        /**
         * @type {string}
         * @private
         */
        this._s =
            '<svg xmlns="' + SVG_CONSTANTS.XMLNS + '" width="' + 
            iconSize + '" height="' + iconSize + '" viewBox="0 0 ' + 
            iconSize + ' ' + iconSize + '">';
    }

    /**
     * Fills the background with the specified color.
     * @param {string} fillColor  Fill color on the format #rrggbb.
     * @param {number} opacity  Opacity in the range [0.0, 1.0].
     */
    setBackground(fillColor, opacity) {
        if (opacity) {
            this._s += '<rect width="100%" height="100%" fill="' + 
                fillColor + '" opacity="' + opacity.toFixed(2) + '"/>';
        }
    }

    /**
     * Writes a path to the SVG string.
     * @param {string} color Fill color on format #rrggbb.
     * @param {string} dataString The SVG path data string.
     */
    appendPath(color, dataString) {
        this._s += '<path fill="' + color + '" d="' + dataString + '"/>';
    }

    /**
     * Gets the rendered image as an SVG string.
     */
    toString() {
        return this._s + "</svg>";
    }
}

/**
 * Draws an identicon as an SVG string.
 * @param {*} hashOrValue - A hexadecimal hash string or any value that will be hashed by Jdenticon.
 * @param {number} size - Icon size in pixels.
 * @param {Object|number=} config - Optional configuration. If specified, this configuration object overrides any
 *    global configuration in its entirety. For backward compatibility a padding value in the range [0.0, 0.5) can be
 *    specified in place of a configuration object.
 * @returns {string} SVG string
 */
function toSvg(hashOrValue, size, config) {
    const writer = new SvgWriter(size);
    iconGenerator(new SvgRenderer(writer), 
        isValidHash(hashOrValue) || computeHash(hashOrValue),
        config);
    return writer.toString();
}

// This file is compiled to dist/jdenticon-node.mjs

if (typeof process === "undefined" &&
    typeof window !== "undefined" &&
    typeof document !== "undefined"
) {
    console.warn(
        "Jdenticon: 'dist/jdenticon-node.mjs' is only intended for Node.js environments and will increase your " +
        "bundle size when included in browser bundles. If you want to run Jdenticon in the browser, please add a " +
        "reference to 'dist/jdenticon.js' or 'dist/jdenticon.min.js' instead.");
}

/**
 * Specifies the version of the Jdenticon package in use.
 * @type {string}
 */
const version = "3.1.0";

/**
 * Specifies which bundle of Jdenticon that is used.
 * @type {string}
 */
const bundle = "node-esm";

/**
 * @throws {Error}
 */
function update() {
    throw new Error("jdenticon.update() is not supported on Node.js.");
}

/**
 * @throws {Error}
 */
function updateCanvas() {
    throw new Error("jdenticon.updateCanvas() is not supported on Node.js.");
}

/**
 * @throws {Error}
 */
function updateSvg() {
    throw new Error("jdenticon.updateSvg() is not supported on Node.js.");
}

export { bundle, configure, drawIcon, toPng, toSvg, update, updateCanvas, updateSvg, version };
//# sourceMappingURL=jdenticon-node.mjs.map

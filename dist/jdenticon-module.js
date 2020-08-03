/**
 * Jdenticon 3.0.1
 * http://jdenticon.com
 *
 * Built: 2020-08-03T16:58:18.496Z
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

'use strict';

/**
 * Parses a substring of the hash as a number.
 * @param {number} startPosition 
 * @param {number=} octets 
 * @noinline
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
 */
function parseColor(color) {
    if (/^#[0-9a-f]{3,8}$/i.test(color)) {
        var result;

        if (color.length < 6) {
            var r = color[1],
                  g = color[2],
                  b = color[3],
                  a = color[4] || "";
            result = "#" + r + r + g + g + b + b + a + a;
        }
        if (color.length == 7 || color.length > 8) {
            result = color;
        }
        
        return result;
    }
}

/**
 * @param {string} hexColor  Color on the format "#RRGGBB" or "#RRGGBBAA"
 */
function toCss3Color(hexColor) {
    var a = parseHex(hexColor, 7, 2);
    var result;

    if (isNaN(a)) {
        result = hexColor;
    } else {
        var r = parseHex(hexColor, 1, 2),
            g = parseHex(hexColor, 3, 2),
            b = parseHex(hexColor, 5, 2);
        result = "rgba(" + r + "," + g + "," + b + "," + (a / 255).toFixed(2) + ")";
    }

    return result;
}

/**
 * @param h Hue [0, 1]
 * @param s Saturation [0, 1]
 * @param l Lightness [0, 1]
 */
function hsl(h, s, l) {
    // Based on http://www.w3.org/TR/2011/REC-css3-color-20110607/#hsl-color
    var result;

    if (s == 0) {
        var partialHex = decToHex(l * 255);
        result = partialHex + partialHex + partialHex;
    }
    else {
        var m2 = l <= 0.5 ? l * (s + 1) : l + s - l * s,
              m1 = l * 2 - m2;
        result =
            hueToRgb(m1, m2, h * 6 + 2) +
            hueToRgb(m1, m2, h * 6) +
            hueToRgb(m1, m2, h * 6 - 2);
    }

    return "#" + result;
}

// This function will correct the lightness for the "dark" hues
function correctedHsl(h, s, l) {
    // The corrector specifies the perceived middle lightness for each hue
    var correctors = [ 0.55, 0.5, 0.5, 0.46, 0.6, 0.55, 0.55 ],
          corrector = correctors[(h * 6 + 0.5) | 0];
    
    // Adjust the input lightness relative to the corrector
    l = l < 0.5 ? l * corrector * 2 : corrector + (l - 0.5) * (1 - corrector) * 2;
    
    return hsl(h, s, l);
}

// In the future we can replace `GLOBAL` with `globalThis`, but for now use the old school global detection for
// backward compatibility.

var GLOBAL = 
    typeof window !== "undefined" ? window :
    typeof self !== "undefined" ? self :
    typeof global !== "undefined" ? global :
    {};

/**
 * @noinline
 */
var ROOT_CONFIG_PROPERTY = "config";

var rootConfigurationHolder = {};

/**
 * Defines the deprecated `config` property on the root Jdenticon object without printing a warning in the console
 * when it is being used.
 * @param {!Object} rootObject 
 */
function defineConfigProperty(rootObject) {
    rootConfigurationHolder = rootObject;
}

/**
 * Sets a new icon style configuration. The new configuration is not merged with the previous one. * 
 * @param {Object} newConfiguration - New configuration object.
 */
function configure(newConfiguration) {
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
function getConfiguration(paddingOrLocalConfig, defaultPadding) {
    var configObject = 
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
        var range = lightnessConfig[configName];
        
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
        var hueConfig = configObject["hues"];
        var hue;
        
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
        P/*hue*/: hueFunction,
        n/*colorSaturation*/: typeof colorSaturation == "number" ? colorSaturation : 0.5,
        C/*grayscaleSaturation*/: typeof grayscaleSaturation == "number" ? grayscaleSaturation : 0,
        o/*colorLightness*/: lightness("color", [0.4, 0.8]),
        D/*grayscaleLightness*/: lightness("grayscale", [0.3, 0.9]),
        F/*backColor*/: parseColor(backColor),
        R/*iconPadding*/: 
            typeof paddingOrLocalConfig == "number" ? paddingOrLocalConfig : 
            typeof padding == "number" ? padding : 
            defaultPadding
    }
}

/**
 * Represents a point.
 */
var Point = function Point(x, y) {
    this.x = x;
    this.y = y;
};

/**
 * Translates and rotates a point before being passed on to the canvas context. This was previously done by the canvas context itself, 
 * but this caused a rendering issue in Chrome on sizes > 256 where the rotation transformation of inverted paths was not done properly.
 */
var Transform = function Transform(x, y, size, rotation) {
    this.p/*_x*/ = x;
    this.q/*_y*/ = y;
    this.G/*_size*/ = size;
    this.S/*_rotation*/ = rotation;
};

/**
 * Transforms the specified point based on the translation and rotation specification for this Transform.
 * @param {number} x x-coordinate
 * @param {number} y y-coordinate
 * @param {number=} w The width of the transformed rectangle. If greater than 0, this will ensure the returned point is of the upper left corner of the transformed rectangle.
 * @param {number=} h The height of the transformed rectangle. If greater than 0, this will ensure the returned point is of the upper left corner of the transformed rectangle.
 */
Transform.prototype.H/*transformIconPoint*/ = function transformIconPoint (x, y, w, h) {
    var right = this.p/*_x*/ + this.G/*_size*/,
          bottom = this.q/*_y*/ + this.G/*_size*/,
          rotation = this.S/*_rotation*/;
    return rotation === 1 ? new Point(right - y - (h || 0), this.q/*_y*/ + x) :
           rotation === 2 ? new Point(right - x - (w || 0), bottom - y - (h || 0)) :
           rotation === 3 ? new Point(this.p/*_x*/ + y, bottom - x - (w || 0)) :
           new Point(this.p/*_x*/ + x, this.q/*_y*/ + y);
};

var NO_TRANSFORM = new Transform(0, 0, 0, 0);

/**
 * Provides helper functions for rendering common basic shapes.
 */
var Graphics = function Graphics(renderer) {
    this.I/*_renderer*/ = renderer;
    this.t/*_transform*/ = NO_TRANSFORM;
};

/**
 * Adds a polygon to the underlying renderer.
 * @param {Array} points The points of the polygon clockwise on the format [ x0, y0, x1, y1, ..., xn, yn ]
 * @param {boolean=} invert Specifies if the polygon will be inverted.
 */
Graphics.prototype.g/*addPolygon*/ = function addPolygon (points, invert) {
    var di = invert ? -2 : 2, 
          transform = this.t/*_transform*/,
          transformedPoints = [];
        
    for (var i = invert ? points.length - 2 : 0; i < points.length && i >= 0; i += di) {
        transformedPoints.push(transform.H/*transformIconPoint*/(points[i], points[i + 1]));
    }
        
    this.I/*_renderer*/.g/*addPolygon*/(transformedPoints);
};
    
/**
 * Adds a polygon to the underlying renderer.
 * Source: http://stackoverflow.com/a/2173084
 * @param {number} x The x-coordinate of the upper left corner of the rectangle holding the entire ellipse.
 * @param {number} y The y-coordinate of the upper left corner of the rectangle holding the entire ellipse.
 * @param {number} size The size of the ellipse.
 * @param {boolean=} invert Specifies if the ellipse will be inverted.
 */
Graphics.prototype.h/*addCircle*/ = function addCircle (x, y, size, invert) {
    var p = this.t/*_transform*/.H/*transformIconPoint*/(x, y, size, size);
    this.I/*_renderer*/.h/*addCircle*/(p, size, invert);
};

/**
 * Adds a rectangle to the underlying renderer.
 * @param {number} x The x-coordinate of the upper left corner of the rectangle.
 * @param {number} y The y-coordinate of the upper left corner of the rectangle.
 * @param {number} w The width of the rectangle.
 * @param {number} h The height of the rectangle.
 * @param {boolean=} invert Specifies if the rectangle will be inverted.
 */
Graphics.prototype.i/*addRectangle*/ = function addRectangle (x, y, w, h, invert) {
    this.g/*addPolygon*/([
        x, y, 
        x + w, y,
        x + w, y + h,
        x, y + h
    ], invert);
};

/**
 * Adds a right triangle to the underlying renderer.
 * @param {number} x The x-coordinate of the upper left corner of the rectangle holding the triangle.
 * @param {number} y The y-coordinate of the upper left corner of the rectangle holding the triangle.
 * @param {number} w The width of the triangle.
 * @param {number} h The height of the triangle.
 * @param {number} r The rotation of the triangle (clockwise). 0 = right corner of the triangle in the lower left corner of the bounding rectangle.
 * @param {boolean=} invert Specifies if the triangle will be inverted.
 */
Graphics.prototype.j/*addTriangle*/ = function addTriangle (x, y, w, h, r, invert) {
    var points = [
        x + w, y, 
        x + w, y + h, 
        x, y + h,
        x, y
    ];
    points.splice(((r || 0) % 4) * 2, 2);
    this.g/*addPolygon*/(points, invert);
};

/**
 * Adds a rhombus to the underlying renderer.
 * @param {number} x The x-coordinate of the upper left corner of the rectangle holding the rhombus.
 * @param {number} y The y-coordinate of the upper left corner of the rectangle holding the rhombus.
 * @param {number} w The width of the rhombus.
 * @param {number} h The height of the rhombus.
 * @param {boolean=} invert Specifies if the rhombus will be inverted.
 */
Graphics.prototype.J/*addRhombus*/ = function addRhombus (x, y, w, h, invert) {
    this.g/*addPolygon*/([
        x + w / 2, y,
        x + w, y + h / 2,
        x + w / 2, y + h,
        x, y + h / 2
    ], invert);
};

/**
 * @param {number} index
 * @param {Graphics} g
 * @param {number} cell
 * @param {number} positionIndex
 */
function centerShape(index, g, cell, positionIndex) {
    index = index % 14;

    var k, m, w, h, inner, outer;

    !index ? (
        k = cell * 0.42,
        g.g/*addPolygon*/([
            0, 0,
            cell, 0,
            cell, cell - k * 2,
            cell - k, cell,
            0, cell
        ])) :

    index == 1 ? (
        w = 0 | (cell * 0.5), 
        h = 0 | (cell * 0.8),

        g.j/*addTriangle*/(cell - w, 0, w, h, 2)) :

    index == 2 ? (
        w = 0 | (cell / 3),
        g.i/*addRectangle*/(w, w, cell - w, cell - w)) :

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

        g.i/*addRectangle*/(outer, outer, cell - inner - outer, cell - inner - outer)) :

    index == 4 ? (
        m = 0 | (cell * 0.15),
        w = 0 | (cell * 0.5),
        g.h/*addCircle*/(cell - w - m, cell - w - m, w)) :

    index == 5 ? (
        inner = cell * 0.1,
        outer = inner * 4,

        // Align edge to nearest pixel in large icons
        outer > 3 && (outer = 0 | outer),
        
        g.i/*addRectangle*/(0, 0, cell, cell),
        g.g/*addPolygon*/([
            outer, outer,
            cell - inner, outer,
            outer + (cell - outer - inner) / 2, cell - inner
        ], true)) :

    index == 6 ? 
        g.g/*addPolygon*/([
            0, 0,
            cell, 0,
            cell, cell * 0.7,
            cell * 0.4, cell * 0.4,
            cell * 0.7, cell,
            0, cell
        ]) :

    index == 7 ? 
        g.j/*addTriangle*/(cell / 2, cell / 2, cell / 2, cell / 2, 3) :

    index == 8 ? (
        g.i/*addRectangle*/(0, 0, cell, cell / 2),
        g.i/*addRectangle*/(0, cell / 2, cell / 2, cell / 2),
        g.j/*addTriangle*/(cell / 2, cell / 2, cell / 2, cell / 2, 1)) :

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

        g.i/*addRectangle*/(0, 0, cell, cell),
        g.i/*addRectangle*/(outer, outer, cell - outer - inner, cell - outer - inner, true)) :

    index == 10 ? (
        inner = cell * 0.12,
        outer = inner * 3,

        g.i/*addRectangle*/(0, 0, cell, cell),
        g.h/*addCircle*/(outer, outer, cell - inner - outer, true)) :

    index == 11 ? 
        g.j/*addTriangle*/(cell / 2, cell / 2, cell / 2, cell / 2, 3) :

    index == 12 ? (
        m = cell * 0.25,
        g.i/*addRectangle*/(0, 0, cell, cell),
        g.J/*addRhombus*/(m, m, cell - m, cell - m, true)) :

    // 13
    (
        !positionIndex && (
            m = cell * 0.4, w = cell * 1.2,
            g.h/*addCircle*/(m, m, w)
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

    var m;

    !index ?
        g.j/*addTriangle*/(0, 0, cell, cell, 0) :
        
    index == 1 ?
        g.j/*addTriangle*/(0, cell / 2, cell, cell / 2, 0) :

    index == 2 ?
        g.J/*addRhombus*/(0, 0, cell, cell) :

    // 3
    (
        m = cell / 6,
        g.h/*addCircle*/(m, m, cell - 2 * m)
    );
}

/**
 * Gets a set of identicon color candidates for a specified hue and config.
 */
function colorTheme(hue, config) {
    hue = config.P/*hue*/(hue);
    return [
        // Dark gray
        correctedHsl(hue, config.C/*grayscaleSaturation*/, config.D/*grayscaleLightness*/(0)),
        // Mid color
        correctedHsl(hue, config.n/*colorSaturation*/, config.o/*colorLightness*/(0.5)),
        // Light gray
        correctedHsl(hue, config.C/*grayscaleSaturation*/, config.D/*grayscaleLightness*/(1)),
        // Light color
        correctedHsl(hue, config.n/*colorSaturation*/, config.o/*colorLightness*/(1)),
        // Dark color
        correctedHsl(hue, config.n/*colorSaturation*/, config.o/*colorLightness*/(0))
    ];
}

/**
 * Draws an identicon to a specified renderer.
 */
function iconGenerator(renderer, hash, config) {
    config = getConfiguration(config, 0.08);

    // Set background color
    if (config.F/*backColor*/) {
        renderer.m/*setBackground*/(config.F/*backColor*/);
    }
    
    // Calculate padding and round to nearest integer
    var size = renderer.k/*iconSize*/;
    var padding = (0.5 + size * config.R/*iconPadding*/) | 0;
    size -= padding * 2;
    
    var graphics = new Graphics(renderer);
    
    // Calculate cell size and ensure it is an integer
    var cell = 0 | (size / 4);
    
    // Since the cell size is integer based, the actual icon will be slightly smaller than specified => center icon
    var x = 0 | (padding + size / 2 - cell * 2);
    var y = 0 | (padding + size / 2 - cell * 2);

    function renderShape(colorIndex, shapes, index, rotationIndex, positions) {
        var shapeIndex = parseHex(hash, index, 1);
        var r = rotationIndex ? parseHex(hash, rotationIndex, 1) : 0;
        
        renderer.K/*beginShape*/(availableColors[selectedColorIndexes[colorIndex]]);
        
        for (var i = 0; i < positions.length; i++) {
            graphics.t/*_transform*/ = new Transform(x + positions[i][0] * cell, y + positions[i][1] * cell, cell, r++ % 4);
            shapes(shapeIndex, graphics, cell, i);
        }
        
        renderer.L/*endShape*/();
    }

    // AVAILABLE COLORS
    var hue = parseHex(hash, -7) / 0xfffffff,
    
          // Available colors for this icon
          availableColors = colorTheme(hue, config),

          // The index of the selected colors
          selectedColorIndexes = [];

    var index;

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
    var HASH_SIZE_HALF_BYTES = 40;
    var BLOCK_SIZE_WORDS = 16;

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
 */
var CanvasRenderer = function CanvasRenderer(ctx, iconSize) {
    var width = ctx.canvas.width,
          height = ctx.canvas.height;
        
    ctx.save();
        
    if (!iconSize) {
        iconSize = Math.min(width, height);
            
        ctx.translate(
            ((width - iconSize) / 2) | 0,
            ((height - iconSize) / 2) | 0);
    }

    this.l/*_ctx*/ = ctx;
    this.k/*iconSize*/ = iconSize;
        
    ctx.clearRect(0, 0, iconSize, iconSize);
};

/**
 * Fills the background with the specified color.
 * @param {string} fillColor  Fill color on the format #rrggbb[aa].
 */
CanvasRenderer.prototype.m/*setBackground*/ = function setBackground (fillColor) {
    var ctx = this.l/*_ctx*/,
          iconSize = this.k/*iconSize*/;

    ctx.fillStyle = toCss3Color(fillColor);
    ctx.fillRect(0, 0, iconSize, iconSize);
};

/**
 * Marks the beginning of a new shape of the specified color. Should be ended with a call to endShape.
 * @param {string} fillColor Fill color on format #rrggbb[aa].
 */
CanvasRenderer.prototype.K/*beginShape*/ = function beginShape (fillColor) {
    var ctx = this.l/*_ctx*/;
    ctx.fillStyle = toCss3Color(fillColor);
    ctx.beginPath();
};

/**
 * Marks the end of the currently drawn shape. This causes the queued paths to be rendered on the canvas.
 */
CanvasRenderer.prototype.L/*endShape*/ = function endShape () {
    this.l/*_ctx*/.fill();
};

/**
 * Adds a polygon to the rendering queue.
 * @param points An array of Point objects.
 */
CanvasRenderer.prototype.g/*addPolygon*/ = function addPolygon (points) {
    var ctx = this.l/*_ctx*/;
    ctx.moveTo(points[0].x, points[0].y);
    for (var i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
};

/**
 * Adds a circle to the rendering queue.
 * @param {Point} point The upper left corner of the circle bounding box.
 * @param {number} diameter The diameter of the circle.
 * @param {boolean} counterClockwise True if the circle is drawn counter-clockwise (will result in a hole if rendered on a clockwise path).
 */
CanvasRenderer.prototype.h/*addCircle*/ = function addCircle (point, diameter, counterClockwise) {
    var ctx = this.l/*_ctx*/,
          radius = diameter / 2;
    ctx.moveTo(point.x + radius, point.y + radius);
    ctx.arc(point.x + radius, point.y + radius, radius, 0, Math.PI * 2, counterClockwise);
    ctx.closePath();
};

/**
 * Called when the icon has been completely drawn.
 */
CanvasRenderer.prototype.finish = function finish () {
    this.l/*_ctx*/.restore();
};

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
var SvgPath = function SvgPath() {
    /**
     * This property holds the data string (path.d) of the SVG path.
     */
    this.u/*dataString*/ = "";
};

/**
 * Adds a polygon with the current fill color to the SVG path.
 * @param points An array of Point objects.
 */
SvgPath.prototype.g/*addPolygon*/ = function addPolygon (points) {
    var dataString = "";
    for (var i = 0; i < points.length; i++) {
        dataString += (i ? "L" : "M") + svgValue(points[i].x) + " " + svgValue(points[i].y);
    }
    this.u/*dataString*/ += dataString + "Z";
};

/**
 * Adds a circle with the current fill color to the SVG path.
 * @param {Point} point The upper left corner of the circle bounding box.
 * @param {number} diameter The diameter of the circle.
 * @param {boolean} counterClockwise True if the circle is drawn counter-clockwise (will result in a hole if rendered on a clockwise path).
 */
SvgPath.prototype.h/*addCircle*/ = function addCircle (point, diameter, counterClockwise) {
    var sweepFlag = counterClockwise ? 0 : 1,
          svgRadius = svgValue(diameter / 2),
          svgDiameter = svgValue(diameter),
          svgArc = "a" + svgRadius + "," + svgRadius + " 0 1," + sweepFlag + " ";
            
    this.u/*dataString*/ += 
        "M" + svgValue(point.x) + " " + svgValue(point.y + diameter / 2) +
        svgArc + svgDiameter + ",0" + 
        svgArc + (-svgDiameter) + ",0";
};

/**
 * Renderer producing SVG output.
 */
var SvgRenderer = function SvgRenderer(target) {
    /**
     * @type {SvgPath}
     */
    this.v/*_path*/;
    this.A/*_pathsByColor*/ = { };
    this.M/*_target*/ = target;
    this.k/*iconSize*/ = target.k/*iconSize*/;
};

/**
 * Fills the background with the specified color.
 * @param {string} fillColor  Fill color on the format #rrggbb[aa].
 */
SvgRenderer.prototype.m/*setBackground*/ = function setBackground (fillColor) {
    var match = /^(#......)(..)?/.exec(fillColor),
          opacity = match[2] ? parseHex(match[2], 0) / 255 : 1;
    this.M/*_target*/.m/*setBackground*/(match[1], opacity);
};

/**
 * Marks the beginning of a new shape of the specified color. Should be ended with a call to endShape.
 * @param {string} color Fill color on format #xxxxxx.
 */
SvgRenderer.prototype.K/*beginShape*/ = function beginShape (color) {
    this.v/*_path*/ = this.A/*_pathsByColor*/[color] || (this.A/*_pathsByColor*/[color] = new SvgPath());
};

/**
 * Marks the end of the currently drawn shape.
 */
SvgRenderer.prototype.L/*endShape*/ = function endShape () { };

/**
 * Adds a polygon with the current fill color to the SVG.
 * @param points An array of Point objects.
 */
SvgRenderer.prototype.g/*addPolygon*/ = function addPolygon (points) {
    this.v/*_path*/.g/*addPolygon*/(points);
};

/**
 * Adds a circle with the current fill color to the SVG.
 * @param {Point} point The upper left corner of the circle bounding box.
 * @param {number} diameter The diameter of the circle.
 * @param {boolean} counterClockwise True if the circle is drawn counter-clockwise (will result in a hole if rendered on a clockwise path).
 */
SvgRenderer.prototype.h/*addCircle*/ = function addCircle (point, diameter, counterClockwise) {
    this.v/*_path*/.h/*addCircle*/(point, diameter, counterClockwise);
};

/**
 * Called when the icon has been completely drawn.
 */
SvgRenderer.prototype.finish = function finish () {
        var this$1 = this;
 
    var pathsByColor = this.A/*_pathsByColor*/;
    for (var color in pathsByColor) {
        // hasOwnProperty cannot be shadowed in pathsByColor
        // eslint-disable-next-line no-prototype-builtins
        if (pathsByColor.hasOwnProperty(color)) {
            this$1.M/*_target*/.N/*appendPath*/(color, pathsByColor[color].u/*dataString*/);
        }
    }
};

/**
 * Renderer producing SVG output.
 */
var SvgWriter = function SvgWriter(iconSize) {
    this.k/*iconSize*/ = iconSize;
    this.B/*_s*/ =
        '<svg xmlns="http://www.w3.org/2000/svg" width="' + 
        iconSize + '" height="' + iconSize + '" viewBox="0 0 ' + 
        iconSize + ' ' + iconSize + '">';
};

/**
 * Fills the background with the specified color.
 * @param {string} fillColor  Fill color on the format #rrggbb.
 * @param {number} opacity  Opacity in the range [0.0, 1.0].
 */
SvgWriter.prototype.m/*setBackground*/ = function setBackground (fillColor, opacity) {
    if (opacity) {
        this.B/*_s*/ += '<rect width="100%" height="100%" fill="' + 
            fillColor + '" opacity="' + opacity.toFixed(2) + '"/>';
    }
};

/**
 * Writes a path to the SVG string.
 * @param {string} color Fill color on format #rrggbb.
 * @param {string} dataString The SVG path data string.
 */
SvgWriter.prototype.N/*appendPath*/ = function appendPath (color, dataString) {
    this.B/*_s*/ += '<path fill="' + color + '" d="' + dataString + '"/>';
};

/**
 * Gets the rendered image as an SVG string.
 */
SvgWriter.prototype.toString = function toString () {
    return this.B/*_s*/ + "</svg>";
};

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
    var writer = new SvgWriter(size);
    iconGenerator(new SvgRenderer(writer), 
        isValidHash(hashOrValue) || computeHash(hashOrValue),
        config);
    return writer.toString();
}

var ICON_TYPE_SVG = 1;

var ICON_TYPE_CANVAS = 2;

/**
 * @noinline
 */
var HASH_ATTRIBUTE = "data-jdenticon-hash";

/**
 * @noinline
 */
var VALUE_ATTRIBUTE = "data-jdenticon-value";

/**
 * @noinline
 */
var ICON_SELECTOR = "[" + HASH_ATTRIBUTE +"],[" + VALUE_ATTRIBUTE +"]";

var documentQuerySelectorAll = /** @type {!Function} */ (
    typeof document !== "undefined" && document.querySelectorAll.bind(document));

function getIdenticonType(el) {
    if (el) {
        var tagName = el["tagName"];

        if (/^svg$/i.test(tagName)) {
            return ICON_TYPE_SVG;
        }

        if (/^canvas$/i.test(tagName) && "getContext" in el) {
            return ICON_TYPE_CANVAS;
        }
    }
}

/**
 * Creates a new element and adds it to the specified parent.
 * @param {Element} parentNode
 * @param {string} name
 * @param {...(string|number)} keyValuePairs
 */
function SvgElement_append(parentNode, name) {
    var keyValuePairs = [], len = arguments.length - 2;
    while ( len-- > 0 ) keyValuePairs[ len ] = arguments[ len + 2 ];

    var el = document.createElementNS("http://www.w3.org/2000/svg", name);
    
    for (var i = 0; i + 1 < keyValuePairs.length; i += 2) {
        el.setAttribute(
            /** @type {string} */ (keyValuePairs[i]),
            /** @type {string|number} */ (keyValuePairs[i + 1])
            );
    }

    parentNode.appendChild(el);
}


/**
 * Renderer producing SVG output.
 */
var SvgElement = function SvgElement(element) {
    // Don't use the clientWidth and clientHeight properties on SVG elements
    // since Firefox won't serve a proper value of these properties on SVG
    // elements (https://bugzilla.mozilla.org/show_bug.cgi?id=874811)
    // Instead use 100px as a hardcoded size (the svg viewBox will rescale 
    // the icon to the correct dimensions)
    var iconSize = this.k/*iconSize*/ = Math.min(
        (Number(element.getAttribute("width")) || 100),
        (Number(element.getAttribute("height")) || 100)
        );
    this.O/*_el*/ = element;
        
    // Clear current SVG child elements
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
        
    // Set viewBox attribute to ensure the svg scales nicely.
    element.setAttribute("viewBox", "0 0 " + iconSize + " " + iconSize);
    element.setAttribute("preserveAspectRatio", "xMidYMid meet");
};

/**
 * Fills the background with the specified color.
 * @param {string} fillColor  Fill color on the format #rrggbb.
 * @param {number} opacity  Opacity in the range [0.0, 1.0].
 */
SvgElement.prototype.m/*setBackground*/ = function setBackground (fillColor, opacity) {
    if (opacity) {
        SvgElement_append(this.O/*_el*/, "rect",
            "width", "100%",
            "height", "100%",
            "fill", fillColor,
            "opacity", opacity);
    }
};

/**
 * Appends a path to the SVG element.
 * @param {string} color Fill color on format #xxxxxx.
 * @param {string} dataString The SVG path data string.
 */
SvgElement.prototype.N/*appendPath*/ = function appendPath (color, dataString) {
    SvgElement_append(this.O/*_el*/, "path",
        "fill", color,
        "d", dataString);
};

/**
 * Updates all canvas elements with the `data-jdenticon-hash` or `data-jdenticon-value` attribute.
 */
function updateAll() {
    if (documentQuerySelectorAll) {
        update(ICON_SELECTOR);
    }
}

/**
 * Updates the identicon in the specified `<canvas>` or `<svg>` elements.
 * @param {(string|Element)} el - Specifies the container in which the icon is rendered as a DOM element of the type
 *    `<svg>` or `<canvas>`, or a CSS selector to such an element.
 * @param {*=} hashOrValue - Optional hash or value to be rendered. If not specified, the `data-jdenticon-hash` or
 *    `data-jdenticon-value` attribute will be evaluated.
 * @param {Object|number=} config - Optional configuration. If specified, this configuration object overrides any
 *    global configuration in its entirety. For backward compability a padding value in the range [0.0, 0.5) can be
 *    specified in place of a configuration object.
 */
function update(el, hashOrValue, config) {
    renderDomElement(el, hashOrValue, config, function (el, iconType) {
        if (iconType) {
            return iconType == ICON_TYPE_SVG ? 
                new SvgRenderer(new SvgElement(el)) : 
                new CanvasRenderer(el.getContext("2d"));
        }
    });
}

/**
 * Updates the identicon in the specified `<canvas>` elements.
 * @param {(string|Element)} el - Specifies the container in which the icon is rendered as a DOM element of the type
 *    `<canvas>`, or a CSS selector to such an element.
 * @param {*=} hashOrValue - Optional hash or value to be rendered. If not specified, the `data-jdenticon-hash` or
 *    `data-jdenticon-value` attribute will be evaluated.
 * @param {Object|number=} config - Optional configuration. If specified, this configuration object overrides any
 *    global configuration in its entirety. For backward compability a padding value in the range [0.0, 0.5) can be
 *    specified in place of a configuration object.
 */
function updateCanvas(el, hashOrValue, config) {
    renderDomElement(el, hashOrValue, config, function (el, iconType) {
        if (iconType == ICON_TYPE_CANVAS) {
            return new CanvasRenderer(el.getContext("2d"));
        }
    });
}

/**
 * Updates the identicon in the specified `<svg>` elements.
 * @param {(string|Element)} el - Specifies the container in which the icon is rendered as a DOM element of the type
 *    `<svg>`, or a CSS selector to such an element.
 * @param {*=} hashOrValue - Optional hash or value to be rendered. If not specified, the `data-jdenticon-hash` or
 *    `data-jdenticon-value` attribute will be evaluated.
 * @param {Object|number=} config - Optional configuration. If specified, this configuration object overrides any
 *    global configuration in its entirety. For backward compability a padding value in the range [0.0, 0.5) can be
 *    specified in place of a configuration object.
 */
function updateSvg(el, hashOrValue, config) {
    renderDomElement(el, hashOrValue, config, function (el, iconType) {
        if (iconType == ICON_TYPE_SVG) {
            return new SvgRenderer(new SvgElement(el));
        }
    });
}

/**
 * Updates the identicon in the specified canvas or svg elements.
 * @param {(string|Element)} el - Specifies the container in which the icon is rendered as a DOM element of the type
 *    `<svg>` or `<canvas>`, or a CSS selector to such an element.
 * @param {*} hashOrValue - Optional hash or value to be rendered. If not specified, the `data-jdenticon-hash` or
 *    `data-jdenticon-value` attribute will be evaluated.
 * @param {Object|number|undefined} config
 * @param {function(Element,number)} rendererFactory - Factory function for creating an icon renderer.
 */
function renderDomElement(el, hashOrValue, config, rendererFactory) {
    if (typeof el === "string") {
        if (documentQuerySelectorAll) {
            var elements = documentQuerySelectorAll(el);
            for (var i = 0; i < elements.length; i++) {
                renderDomElement(elements[i], hashOrValue, config, rendererFactory);
            }
        }
        return;
    }
    
    // Hash selection. The result from getValidHash or computeHash is 
    // accepted as a valid hash.
    var hash = 
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
    
    var renderer = rendererFactory(el, getIdenticonType(el));
    if (renderer) {
        // Draw icon
        iconGenerator(renderer, hash, config);
    }
}

// This file is compiled to dist/jdenticon-module.js

var jdenticon = updateAll;

defineConfigProperty(jdenticon);

// Export public API
jdenticon["configure"] = configure;
jdenticon["drawIcon"] = drawIcon;
jdenticon["toSvg"] = toSvg;
jdenticon["update"] = update;
jdenticon["updateCanvas"] = updateCanvas;
jdenticon["updateSvg"] = updateSvg;

/**
 * Specifies the version of the Jdenticon package in use.
 * @type {string}
 */
jdenticon["version"] = "3.0.1";

/**
 * Specifies which bundle of Jdenticon that is used.
 * @type {string}
 */
jdenticon["bundle"] = "browser-cjs";

module.exports = jdenticon;

//# sourceMappingURL=jdenticon-module.js.map

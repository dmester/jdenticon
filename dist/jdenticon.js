/**
 * Jdenticon 2.0.0
 * http://jdenticon.com
 *  
 * Built: 2018-03-12T19:39:43.855Z
 *
 * Copyright (c) 2014-2018 Daniel Mester Pirttijärvi
 *
 * Permission is hereby granted, free of charge, to any person obtaining 
 * a copy of this software and associated documentation files (the 
 * "Software"), to deal in the Software without restriction, including 
 * without limitation the rights to use, copy, modify, merge, publish, 
 * distribute, sublicense, and/or sell copies of the Software, and to 
 * permit persons to whom the Software is furnished to do so, subject to 
 * the following conditions:
 * 
 * The above copyright notice and this permission notice shall be 
 * included in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, 
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF 
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. 
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY 
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, 
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE 
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

/*jslint bitwise: true */

(function (global, name, factory) {
    var jQuery = global["jQuery"],
        jdenticon = factory(global, jQuery);

    // Node.js
    if (typeof module !== "undefined" && "exports" in module) {
        module["exports"] = jdenticon;
    }
    // RequireJS
    else if (typeof define === "function" && define["amd"]) {
        define([], function () { return jdenticon; });
    }
    // No module loader
    else {
        global[name] = jdenticon;
    }
})(this, "jdenticon", function (global, jQuery) {
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
     * Fills the background with the specified color.
     * @param {string} fillColor  Fill color on the format #rrggbb.
     * @param {number} opacity  Opacity in the range [0.0, 1.0].
     */
    setBackground: function (fillColor, opacity) {
        if (opacity) {
            var rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            rect.setAttribute("width", "100%");
            rect.setAttribute("height", "100%");
            rect.setAttribute("fill", fillColor);
            rect.setAttribute("opacity", opacity.toFixed(2));
            this._el.appendChild(rect);
        }
    },
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



/**
 * Computes a SHA1 hash for any value and returns it as a hexadecimal string.
 * @param {any} message 
 */
function sha1(message) {
    /**
     * Converts an array of 32-bit unsigned numbers to a hexadecimal string in big endian format.
     * @param {Number[]} words
     */
    function wordsToHexString(words) {
        var hashOctets = [];
        for (var i = 0; i < words.length; i++) {
            var val = words[i];
           
            for (var shift = 28; shift >= 0; shift -= 4) {
                var octet = (val >>> shift) & 0xf;
                hashOctets.push(octet.toString(16));
            }
        }

        return hashOctets.join("");
    }
    
    /**
     * Converts the specified message to a sequence of UTF8 encoded and padded 64 byte blocks.
     * @param {any} message  Any value that will be padded to 64 byte blocks.
     */
    function getBlocks(message) {
        var percentEncoded = encodeURI(message),
            binaryMessage = [],
            binaryMessageLength = 0,
            i, b,

            blocks = [],

            BLOCK_SIZE_BYTES = 64,
            BLOCK_SIZE_WORDS = BLOCK_SIZE_BYTES >>> 2,
            MESSAGE_LENGTH_SIZE_BYTES = 8;

        // UTF8 encode message
        for (i = 0; i < percentEncoded.length; i++) {
            if (percentEncoded[i] == "%") {
                b = parseInt(percentEncoded.substr(i + 1, 2), 16);
                i += 2;
            }
            else {
                b = percentEncoded.charCodeAt(i);
            }
            binaryMessage[binaryMessageLength++] = b;
        }

        // Trailing '1' bit
        binaryMessage[binaryMessageLength++] = 0x80;
        
        function getWordBlock(startIndex, byteCount) {
            var words = [];
            var wordIndex = -1;
            
            for (var i = 0; i < byteCount; i++) {
                wordIndex = (i / 4) | 0;
                words[wordIndex] = (words[wordIndex] || 0) +
                    (binaryMessage[startIndex + i] << ((3 - (i & 3)) * 8));
            }
            
            while (++wordIndex < BLOCK_SIZE_WORDS) {
                words[wordIndex] = 0;
            }

            return words;
        }

        // Full blocks
        for (i = 0; i + BLOCK_SIZE_BYTES <= binaryMessageLength; i+= BLOCK_SIZE_BYTES) {
            blocks.push(getWordBlock(i, BLOCK_SIZE_BYTES));
        }

        // Final block(s)
        // Rest of message
        var lastBlockDataLength = binaryMessageLength - i;
        
        var block = getWordBlock(i, lastBlockDataLength);
        
        // If there is no room for the message size in this block, 
        // return the block and put the size in the following block.
        if (lastBlockDataLength + MESSAGE_LENGTH_SIZE_BYTES > BLOCK_SIZE_BYTES) {
            // Message size goes in next block
            blocks.push(block);
            block = getWordBlock(0, 0);
        }

        var messageSizeBits = binaryMessageLength * 8 - 8;
        block[BLOCK_SIZE_WORDS - 1] = messageSizeBits;
        blocks.push(block);

        return blocks;
    }

    /**
     * Rotates the value a specified number of bits to the left.
     * @param {Number} value  Value to rotate
     * @param {Number} shift  Bit count to shift.
     */
    function rotl(value, shift) {
        return (value << shift) | (value >>> (32 - shift));
    }
    
    /**
     * Computes a SHA1 hash for the specified array of 64 byte blocks.
     * @param {Number[][]} blocks 
     */
    function computeHash(blocks) {
        var a = 0x67452301,
            b = 0xefcdab89,
            c = 0x98badcfe,
            d = 0x10325476,
            e = 0xc3d2e1f0,
            hash = [a, b, c, d, e];

        for (var i = 0; i < blocks.length; i++) {
            var w = blocks[i];

            for (var t = 16; t < 80; t++) {
                w[t] = rotl(w[t - 3] ^ w[t - 8] ^ w[t - 14] ^ w[t - 16], 1);
            }

            for (var t = 0; t < 80; t++) {
                var f =
                    // Ch
                    t < 20 ? ((b & c) ^ ((~b) & d)) + 0x5a827999 :
                    
                    // Parity
                    t < 40 ? (b ^ c ^ d) + 0x6ed9eba1 :
                    
                    // Maj
                    t < 60 ? ((b & c) ^ (b & d) ^ (c & d)) + 0x8f1bbcdc :
                    
                    // Parity
                    (b ^ c ^ d) + 0xca62c1d6;

                var T = rotl(a, 5) + f + e + w[t];

                e = d;
                d = c;
                c = rotl(b, 30);
                b = a;
                a = T | 0;
            }

            hash[0] = a = ((hash[0] + a) | 0);
            hash[1] = b = ((hash[1] + b) | 0);
            hash[2] = c = ((hash[2] + c) | 0);
            hash[3] = d = ((hash[3] + d) | 0);
            hash[4] = e = ((hash[4] + e) | 0);
        }

        return hash;
    }

    return wordsToHexString(computeHash(getBlocks(message)));
}



/**
 * Renderer producing SVG output.
 * @private
 * @constructor
 */
function SvgWriter(size) {
    this.size = size;
    this._s =
        '<svg xmlns="http://www.w3.org/2000/svg" width="' + 
        size + '" height="' + size + '" viewBox="0 0 ' + 
        size + ' ' + size + '" preserveAspectRatio="xMidYMid meet">';
}
SvgWriter.prototype = {
    /**
     * Fills the background with the specified color.
     * @param {string} fillColor  Fill color on the format #rrggbb.
     * @param {number} opacity  Opacity in the range [0.0, 1.0].
     */
    setBackground: function (fillColor, opacity) {
        if (opacity) {
            this._s += '<rect width="100%" height="100%" fill="' + 
                fillColor + '" opacity="' + opacity.toFixed(2) + '"/>';
        }
    },
    /**
     * Writes a path to the SVG string.
     * @param {string} color Fill color on format #rrggbb.
     * @param {string} dataString The SVG path data string.
     */
    append: function (color, dataString) {
        this._s += 
            '<path fill="' + color + '" d="' + dataString + '"/>';
    },
    /**
     * Gets the rendered image as an SVG string.
     */
    toString: function () {
        return this._s + "</svg>";
    }
};



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
 * Functions for converting colors to hex-rgb representations.
 * @private
 */
var color = {
    /**
     * @param {number} r Red channel [0, 255]
     * @param {number} g Green channel [0, 255]
     * @param {number} b Blue channel [0, 255]
     */
    rgb: function (r, g, b) {
        return "#" + decToHex(r) + decToHex(g) + decToHex(b);
    },
    /**
     * @param {any} color  Color value to parse. Curently hexadecimal strings on the format #rgb[a] and #rrggbb[aa] are supported.
     */
    parse: function (color) {
        if (/^#[0-9a-f]{3,8}$/i.test(color)) {
            if (color.length < 6) {
                var r = color[1],
                    g = color[2],
                    b = color[3],
                    a = color[4] || "";
                return "#" + r + r + g + g + b + b + a + a;
            }
            if (color.length == 7 || color.length > 8) {
                return color;
            }
        }
    },
    /**
     * @param {string} hexColor  Color on the format "#RRGGBB" or "#RRGGBBAA"
     */
    toCss3: function (hexColor) {
        var a = parseInt(hexColor.substr(7, 2), 16);
        if (isNaN(a)) {
            return hexColor;
        }
        var r = parseInt(hexColor.substr(1, 2), 16),
            g = parseInt(hexColor.substr(3, 2), 16),
            b = parseInt(hexColor.substr(5, 2), 16);
        return "rgba(" + r + "," + g + "," + b + "," + (a / 255).toFixed(2) + ")";
    },
    /**
     * @param h Hue [0, 1]
     * @param s Saturation [0, 1]
     * @param l Lightness [0, 1]
     */
    hsl: function (h, s, l) {
        // Based on http://www.w3.org/TR/2011/REC-css3-color-20110607/#hsl-color
        if (s == 0) {
            var partialHex = decToHex(l * 255);
            return "#" + partialHex + partialHex + partialHex;
        }
        else {
            var m2 = l <= 0.5 ? l * (s + 1) : l + s - l * s,
                m1 = l * 2 - m2;
            return "#" +
                hueToRgb(m1, m2, h * 6 + 2) +
                hueToRgb(m1, m2, h * 6) +
                hueToRgb(m1, m2, h * 6 - 2);
        }
    },
    // This function will correct the lightness for the "dark" hues
    correctedHsl: function (h, s, l) {
        // The corrector specifies the perceived middle lightnesses for each hue
        var correctors = [ 0.55, 0.5, 0.5, 0.46, 0.6, 0.55, 0.55 ],
            corrector = correctors[(h * 6 + 0.5) | 0];
        
        // Adjust the input lightness relative to the corrector
        l = l < 0.5 ? l * corrector * 2 : corrector + (l - 0.5) * (1 - corrector) * 2;
        
        return color.hsl(h, s, l);
    }
};




/**
 * Renderer redirecting drawing commands to a canvas context.
 * @private
 * @constructor
 */
function CanvasRenderer(ctx, size) {
    var width = ctx.canvas.width,
        height = ctx.canvas.height;
    
    ctx.save();
    
    this._ctx = ctx;
    
    if (size) {
        this.size = size;
    }
    else {
        this.size = Math.min(width, height);
        
        ctx.translate(
            ((width - this.size) / 2) | 0,
            ((height - this.size) / 2) | 0);
    }
    
    ctx.clearRect(0, 0, this.size, this.size);
}
CanvasRenderer.prototype = {
    /**
     * Fills the background with the specified color.
     * @param {string} fillColor  Fill color on the format #rrggbb[aa].
     */
    setBackground: function (fillColor) {
        var ctx = this._ctx,
            size = this.size;
                
        ctx.fillStyle = color.toCss3(fillColor);
        ctx.fillRect(0, 0, size, size);
    },
    /**
     * Marks the beginning of a new shape of the specified color. Should be ended with a call to endShape.
     * @param {string} fillColor Fill color on format #rrggbb[aa].
     */
    beginShape: function (fillColor) {
        this._ctx.fillStyle = color.toCss3(fillColor);
        this._ctx.beginPath();
    },
    /**
     * Marks the end of the currently drawn shape. This causes the queued paths to be rendered on the canvas.
     */
    endShape: function () {
        this._ctx.fill();
    },
    /**
     * Adds a polygon to the rendering queue.
     * @param points An array of Point objects.
     */
    addPolygon: function (points) {
        var ctx = this._ctx, i;
        ctx.moveTo(points[0].x, points[0].y);
        for (i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.closePath();
    },
    /**
     * Adds a circle to the rendering queue.
     * @param {Point} point The upper left corner of the circle bounding box.
     * @param {number} diameter The diameter of the circle.
     * @param {boolean} counterClockwise True if the circle is drawn counter-clockwise (will result in a hole if rendered on a clockwise path).
     */
    addCircle: function (point, diameter, counterClockwise) {
        var ctx = this._ctx,
            radius = diameter / 2;
        ctx.moveTo(point.x + radius, point.y + radius);
        ctx.arc(point.x + radius, point.y + radius, radius, 0, Math.PI * 2, counterClockwise);
        ctx.closePath();
    },
    /**
     * Called when the icon has been completely drawn.
     */
    finish: function () {
        this._ctx.restore();
    }
};



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
 * @private
 * @constructor
 */
function SvgPath() {
    /**
     * This property holds the data string (path.d) of the SVG path.
     */
    this.dataString = "";
}
SvgPath.prototype = {
    /**
     * Adds a polygon with the current fill color to the SVG path.
     * @param points An array of Point objects.
     */
    addPolygon: function (points) {
        var dataString = "M" + svgValue(points[0].x) + " " + svgValue(points[0].y);
        for (var i = 1; i < points.length; i++) {
            dataString += "L" + svgValue(points[i].x) + " " + svgValue(points[i].y);
        }
        this.dataString += dataString + "Z";
    },
    /**
     * Adds a circle with the current fill color to the SVG path.
     * @param {Point} point The upper left corner of the circle bounding box.
     * @param {number} diameter The diameter of the circle.
     * @param {boolean} counterClockwise True if the circle is drawn counter-clockwise (will result in a hole if rendered on a clockwise path).
     */
    addCircle: function (point, diameter, counterClockwise) {
        var sweepFlag = counterClockwise ? 0 : 1,
            svgRadius = svgValue(diameter / 2),
            svgDiameter = svgValue(diameter);
            
        this.dataString += 
            "M" + svgValue(point.x) + " " + svgValue(point.y + diameter / 2) +
            "a" + svgRadius + "," + svgRadius + " 0 1," + sweepFlag + " " + svgDiameter + ",0" + 
            "a" + svgRadius + "," + svgRadius + " 0 1," + sweepFlag + " " + (-svgDiameter) + ",0";
    }
};




/**
 * Renderer producing SVG output.
 * @private
 * @constructor
 * @param {SvgElement|SvgWriter} target 
 */
function SvgRenderer(target) {
    this._pathsByColor = { };
    this._target = target;
    this.size = target.size;
}
SvgRenderer.prototype = {
    /**
     * Fills the background with the specified color.
     * @param {string} fillColor  Fill color on the format #rrggbb[aa].
     */
    setBackground: function (fillColor) {
        var match = /^(#......)(..)?/.exec(fillColor),
            opacity = match[2] ? parseInt(match[2], 16) / 255 : 1;
        this._target.setBackground(match[1], opacity);
    },
    /**
     * Marks the beginning of a new shape of the specified color. Should be ended with a call to endShape.
     * @param {string} color Fill color on format #xxxxxx.
     */
    beginShape: function (color) {
        this._path = this._pathsByColor[color] || (this._pathsByColor[color] = new SvgPath());
    },
    /**
     * Marks the end of the currently drawn shape.
     */
    endShape: function () { },
    /**
     * Adds a polygon with the current fill color to the SVG.
     * @param points An array of Point objects.
     */
    addPolygon: function (points) {
        this._path.addPolygon(points);
    },
    /**
     * Adds a circle with the current fill color to the SVG.
     * @param {Point} point The upper left corner of the circle bounding box.
     * @param {number} diameter The diameter of the circle.
     * @param {boolean} counterClockwise True if the circle is drawn counter-clockwise (will result in a hole if rendered on a clockwise path).
     */
    addCircle: function (point, diameter, counterClockwise) {
        this._path.addCircle(point, diameter, counterClockwise);
    },
    /**
     * Called when the icon has been completely drawn.
     */
    finish: function () { 
        for (var color in this._pathsByColor) {
            this._target.append(color, this._pathsByColor[color].dataString);
        }
    }
};



var shapes = {
    center: [
        /** @param {Graphics} g */
        function (g, cell, index) {
            var k = cell * 0.42;
            g.addPolygon([
                0, 0,
                cell, 0,
                cell, cell - k * 2,
                cell - k, cell,
                0, cell
            ]);
        },
        /** @param {Graphics} g */
        function (g, cell, index) {
            var w = 0 | (cell * 0.5), 
                h = 0 | (cell * 0.8);
            g.addTriangle(cell - w, 0, w, h, 2);
        },
        /** @param {Graphics} g */
        function (g, cell, index) { 
            var s = 0 | (cell / 3);
            g.addRectangle(s, s, cell - s, cell - s);
        },
        /** @param {Graphics} g */
        function (g, cell, index) { 
            var inner = cell * 0.1,
                inner = 
                    inner > 1 ? (0 | inner) : // large icon => truncate decimals
                    inner > 0.5 ? 1 :         // medium size icon => fixed width
                    inner,                    // small icon => anti-aliased border
                
                // Use fixed outer border widths in small icons to ensure the border is drawn
                outer = 
                    cell < 6 ? 1 :
                    cell < 8 ? 2 :
                    (0 | (cell * 0.25));
            
            g.addRectangle(outer, outer, cell - inner - outer, cell - inner - outer);
        },
        /** @param {Graphics} g */
        function (g, cell, index) { 
            var m = 0 | (cell * 0.15),
                s = 0 | (cell * 0.5);
            g.addCircle(cell - s - m, cell - s - m, s);
        },
        /** @param {Graphics} g */
        function (g, cell, index) {
            var inner = cell * 0.1,
                outer = inner * 4;

            g.addRectangle(0, 0, cell, cell);
            g.addPolygon([
                outer, 0 | outer,
                cell - inner, 0 | outer,
                outer + (cell - outer - inner) / 2, cell - inner
            ], true);
        },
        /** @param {Graphics} g */
        function (g, cell, index) {
            g.addPolygon([
                0, 0,
                cell, 0,
                cell, cell * 0.7,
                cell * 0.4, cell * 0.4,
                cell * 0.7, cell,
                0, cell
            ]);
        },
        /** @param {Graphics} g */
        function (g, cell, index) {
            g.addTriangle(cell / 2, cell / 2, cell / 2, cell / 2, 3);
        },
        /** @param {Graphics} g */
        function (g, cell, index) {
            g.addRectangle(0, 0, cell, cell / 2);
            g.addRectangle(0, cell / 2, cell / 2, cell / 2);
            g.addTriangle(cell / 2, cell / 2, cell / 2, cell / 2, 1);
        },
        /** @param {Graphics} g */
        function (g, cell, index) {
            var inner = cell * 0.14,
                inner = 
                    cell < 8 ? inner : // small icon => anti-aliased border
                    (0 | inner),       // large icon => truncate decimals
                
                // Use fixed outer border widths in small icons to ensure the border is drawn
                outer = 
                    cell < 4 ? 1 :
                    cell < 6 ? 2 :
                    (0 | (cell * 0.35));
                    
            g.addRectangle(0, 0, cell, cell);
            g.addRectangle(outer, outer, cell - outer - inner, cell - outer - inner, true);
        },
        /** @param {Graphics} g */
        function (g, cell, index) {
            var inner = cell * 0.12,
                outer = inner * 3;

            g.addRectangle(0, 0, cell, cell);
            g.addCircle(outer, outer, cell - inner - outer, true);
        },
        /** @param {Graphics} g */
        function (g, cell, index) {
            g.addTriangle(cell / 2, cell / 2, cell / 2, cell / 2, 3);
        },
        /** @param {Graphics} g */
        function (g, cell, index) {
            var m = cell * 0.25;
            g.addRectangle(0, 0, cell, cell);
            g.addRhombus(m, m, cell - m, cell - m, true);
        },
        /** @param {Graphics} g */
        function (g, cell, index) {
            var m = cell * 0.4, s = cell * 1.2;
            if (!index) {
                g.addCircle(m, m, s);
            }
        }
    ],
    
    outer: [
        /** @param {Graphics} g */
        function (g, cell, index) {
            g.addTriangle(0, 0, cell, cell, 0);
        },
        /** @param {Graphics} g */
        function (g, cell, index) {
            g.addTriangle(0, cell / 2, cell, cell / 2, 0);
        },
        /** @param {Graphics} g */
        function (g, cell, index) {
            g.addRhombus(0, 0, cell, cell);
        },
        /** @param {Graphics} g */
        function (g, cell, index) {
            var m = cell / 6;
            g.addCircle(m, m, cell - 2 * m);
        }
    ]
};




/**
 * Provides helper functions for rendering common basic shapes.
 * @private
 * @constructor
 */
function Graphics(renderer) {
    this._renderer = renderer;
    this._transform = Transform.noTransform;
}
Graphics.prototype = {
    /**
     * Adds a polygon to the underlying renderer.
     * @param {Array} points The points of the polygon clockwise on the format [ x0, y0, x1, y1, ..., xn, yn ]
     * @param {boolean=} invert Specifies if the polygon will be inverted.
     */
    addPolygon: function (points, invert) {
        var di = invert ? -2 : 2, 
            transform = this._transform,
            transformedPoints = [],
            i;
        
        for (i = invert ? points.length - 2 : 0; i < points.length && i >= 0; i += di) {
            transformedPoints.push(transform.transformPoint(points[i], points[i + 1]));
        }
        
        this._renderer.addPolygon(transformedPoints);
    },
    
    /**
     * Adds a polygon to the underlying renderer.
     * Source: http://stackoverflow.com/a/2173084
     * @param {number} x The x-coordinate of the upper left corner of the rectangle holding the entire ellipse.
     * @param {number} y The y-coordinate of the upper left corner of the rectangle holding the entire ellipse.
     * @param {number} size The size of the ellipse.
     * @param {boolean=} invert Specifies if the ellipse will be inverted.
     */
    addCircle: function (x, y, size, invert) {
        var p = this._transform.transformPoint(x, y, size, size);
        this._renderer.addCircle(p, size, invert);
    },

    /**
     * Adds a rectangle to the underlying renderer.
     * @param {number} x The x-coordinate of the upper left corner of the rectangle.
     * @param {number} y The y-coordinate of the upper left corner of the rectangle.
     * @param {number} w The width of the rectangle.
     * @param {number} h The height of the rectangle.
     * @param {boolean=} invert Specifies if the rectangle will be inverted.
     */
    addRectangle: function (x, y, w, h, invert) {
        this.addPolygon([
            x, y, 
            x + w, y,
            x + w, y + h,
            x, y + h
        ], invert);
    },

    /**
     * Adds a right triangle to the underlying renderer.
     * @param {number} x The x-coordinate of the upper left corner of the rectangle holding the triangle.
     * @param {number} y The y-coordinate of the upper left corner of the rectangle holding the triangle.
     * @param {number} w The width of the triangle.
     * @param {number} h The height of the triangle.
     * @param {number} r The rotation of the triangle (clockwise). 0 = right corner of the triangle in the lower left corner of the bounding rectangle.
     * @param {boolean=} invert Specifies if the triangle will be inverted.
     */
    addTriangle: function (x, y, w, h, r, invert) {
        var points = [
            x + w, y, 
            x + w, y + h, 
            x, y + h,
            x, y
        ];
        points.splice(((r || 0) % 4) * 2, 2);
        this.addPolygon(points, invert);
    },

    /**
     * Adds a rhombus to the underlying renderer.
     * @param {number} x The x-coordinate of the upper left corner of the rectangle holding the rhombus.
     * @param {number} y The y-coordinate of the upper left corner of the rectangle holding the rhombus.
     * @param {number} w The width of the rhombus.
     * @param {number} h The height of the rhombus.
     * @param {boolean=} invert Specifies if the rhombus will be inverted.
     */
    addRhombus: function (x, y, w, h, invert) {
        this.addPolygon([
            x + w / 2, y,
            x + w, y + h / 2,
            x + w / 2, y + h,
            x, y + h / 2
        ], invert);
    }
};




/**
 * Gets a set of identicon color candidates for a specified hue and config.
 */
function colorTheme(hue, config) {
    return [
        // Dark gray
        color.hsl(0, 0, config.grayscaleLightness(0)),
        // Mid color
        color.correctedHsl(hue, config.saturation, config.colorLightness(0.5)),
        // Light gray
        color.hsl(0, 0, config.grayscaleLightness(1)),
        // Light color
        color.correctedHsl(hue, config.saturation, config.colorLightness(1)),
        // Dark color
        color.correctedHsl(hue, config.saturation, config.colorLightness(0))
    ];
}



/**
 * Represents a point.
 * @private
 * @constructor
 */
function Point(x, y) {
    this.x = x;
    this.y = y;
};




/**
 * Translates and rotates a point before being passed on to the canvas context. This was previously done by the canvas context itself, 
 * but this caused a rendering issue in Chrome on sizes > 256 where the rotation transformation of inverted paths was not done properly.
 * @param {number} x The x-coordinate of the upper left corner of the transformed rectangle.
 * @param {number} y The y-coordinate of the upper left corner of the transformed rectangle.
 * @param {number} size The size of the transformed rectangle.
 * @param {number} rotation Rotation specified as 0 = 0 rad, 1 = 0.5π rad, 2 = π rad, 3 = 1.5π rad
 * @private
 * @constructor
 */
function Transform(x, y, size, rotation) {
    this._x = x;
    this._y = y;
    this._size = size;
    this._rotation = rotation;
}
Transform.prototype = {
    /**
     * Transforms the specified point based on the translation and rotation specification for this Transform.
     * @param {number} x x-coordinate
     * @param {number} y y-coordinate
     * @param {number=} w The width of the transformed rectangle. If greater than 0, this will ensure the returned point is of the upper left corner of the transformed rectangle.
     * @param {number=} h The height of the transformed rectangle. If greater than 0, this will ensure the returned point is of the upper left corner of the transformed rectangle.
     */
    transformPoint: function (x, y, w, h) {
        var right = this._x + this._size,
            bottom = this._y + this._size;
        return this._rotation === 1 ? new Point(right - y - (h || 0), this._y + x) :
               this._rotation === 2 ? new Point(right - x - (w || 0), bottom - y - (h || 0)) :
               this._rotation === 3 ? new Point(this._x + y, bottom - x - (w || 0)) :
               new Point(this._x + x, this._y + y);
    }
};
Transform.noTransform = new Transform(0, 0, 0, 0);



     
/**
 * Draws an identicon to a specified renderer.
 */
function iconGenerator(renderer, hash, x, y, size, padding, config) {
    var undefined;
    
    // Set background color
    if (config.backColor) {
        renderer.setBackground(config.backColor);
    }
    
    // Calculate padding
    padding = (size * (padding === undefined ? 0.08 : padding)) | 0;
    size -= padding * 2;
    
    var graphics = new Graphics(renderer);
    
    // Calculate cell size and ensure it is an integer
    var cell = 0 | (size / 4);
    
    // Since the cell size is integer based, the actual icon will be slightly smaller than specified => center icon
    x += 0 | (padding + size / 2 - cell * 2);
    y += 0 | (padding + size / 2 - cell * 2);

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
        availableColors = colorTheme(hue, config),

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
    
    renderer.finish();
};



 


var /** @const */
    HASH_ATTRIBUTE = "data-jdenticon-hash",
    VALUE_ATTRIBUTE = "data-jdenticon-value",
    supportsQuerySelectorAll = typeof document !== "undefined" && "querySelectorAll" in document;

/**
 * Gets the normalized current Jdenticon color configuration. Missing fields have default values.
 */
function getCurrentConfig() {
    var configObject = jdenticon["config"] || global["jdenticon_config"] || { },
        lightnessConfig = configObject["lightness"] || { },
        saturation = configObject["saturation"],
        backColor = configObject["backColor"];
    
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
        grayscaleLightness: lightness("grayscale", 0.3, 0.9),
        backColor: color.parse(backColor)
    }
}

/**
 * Inputs a value that might be a valid hash string for Jdenticon and returns it 
 * if it is determined valid, otherwise a falsy value is returned.
 */
function getValidHash(hashCandidate) {
    return /^[0-9a-f]{11,}$/i.test(hashCandidate) && hashCandidate;
}

/**
 * Computes a hash for the specified value. Currnently SHA1 is used. This function
 * always returns a valid hash.
 */
function computeHash(value) {
    return sha1(value == null ? "" : "" + value);
}

/**
 * Updates the identicon in the specified canvas or svg elements.
 * @param {(string|HTMLElement)} el - Specifies the container in which the icon is rendered. Can be a CSS selector or a DOM element of the type SVG or CANVAS.
 * @param {string=} hash - Optional hash to be rendered. If not specified, the hash specified by the data-jdenticon-hash is used.
 * @param {number=} padding - Optional padding in percents. Extra padding might be added to center the rendered identicon.
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
    
    var isSvg = /svg/i.test(el["tagName"]),
        isCanvas = /canvas/i.test(el["tagName"]);
    
    // Ensure we have a supported element
    if (!isSvg && !(isCanvas && "getContext" in el)) {
        return;
    }
    
    // Hash selection. The result from getValidHash or computeHash is 
    // accepted as a valid hash.
    hash = 
        // 1. Explicit valid hash
        getValidHash(hash) ||
        
        // 2. Explicit value
        hash && computeHash(hash) ||
        
        // 3. `data-jdenticon-hash` attribute
        getValidHash(el.getAttribute(HASH_ATTRIBUTE)) ||
        
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
    
    var renderer = isSvg ? 
        new SvgRenderer(new SvgElement(el)) : 
        new CanvasRenderer(el.getContext("2d"));
    
    // Draw icon
    iconGenerator(renderer, hash, 0, 0, renderer.size, padding, getCurrentConfig());
}

/**
 * Draws an identicon to a context.
 * @param {CanvasRenderingContext2D} ctx - Canvas context on which the icon will be drawn at location (0, 0).
 * @param {any} hashOrValue - A hexadecimal hash string or any value that will be hashed by Jdenticon.
 * @param {number} size - Icon size in pixels.
 */
function drawIcon(ctx, hashOrValue, size, padding) {
    if (!ctx) {
        throw new Error("No canvas specified.");
    }
    
    var renderer = new CanvasRenderer(ctx, size);
    iconGenerator(renderer, 
        getValidHash(hashOrValue) || computeHash(hashOrValue), 
        0, 0, size, padding || 0, getCurrentConfig());
}

/**
 * Draws an identicon as an SVG string.
 * @param {any} hashOrValue - A hexadecimal hash string or any value that will be hashed by Jdenticon.
 * @param {number} size - Icon size in pixels.
 * @param {number=} padding - Optional padding in percents. Extra padding might be added to center the rendered identicon.
 * @returns {string} SVG string
 */
function toSvg(hashOrValue, size, padding) {
    var writer = new SvgWriter(size);
    var renderer = new SvgRenderer(writer);
    iconGenerator(renderer, 
        getValidHash(hashOrValue) || computeHash(hashOrValue),
        0, 0, size, padding, getCurrentConfig());
    return writer.toString();
}

/**
 * Updates all canvas elements with the data-jdenticon-hash attribute.
 */
function jdenticon() {
    if (supportsQuerySelectorAll) {
        update("[" + HASH_ATTRIBUTE + "],[" + VALUE_ATTRIBUTE + "]");
    }
}

// Public API
jdenticon["drawIcon"] = drawIcon;
jdenticon["toSvg"] = toSvg;
jdenticon["update"] = update;
jdenticon["version"] = "2.0.0";

// Basic jQuery plugin
if (jQuery) {
    jQuery["fn"]["jdenticon"] = function (hashOrValue, padding) {
        this["each"](function (index, el) {
            update(el, hashOrValue, padding);
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
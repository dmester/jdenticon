/**
 * Jdenticon
 * https://github.com/dmester/jdenticon
 * Copyright © Daniel Mester Pirttijärvi
 */

import { parseHex } from "../common/parseHex";

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
 * @param {number} r Red channel [0, 255]
 * @param {number} g Green channel [0, 255]
 * @param {number} b Blue channel [0, 255]
 */
export function rgb(r, g, b) {
    return "#" + decToHex(r) + decToHex(g) + decToHex(b);
}

/**
 * @param {string} color  Color value to parse. Currently hexadecimal strings on the format #rgb[a] and #rrggbb[aa] are supported.
 * @returns {string}
 */
export function parseColor(color) {
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
export function toCss3Color(hexColor) {
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
export function hsl(hue, saturation, lightness) {
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
export function correctedHsl(hue, saturation, lightness) {
    // The corrector specifies the perceived middle lightness for each hue
    const correctors = [ 0.55, 0.5, 0.5, 0.46, 0.6, 0.55, 0.55 ],
          corrector = correctors[(hue * 6 + 0.5) | 0];
    
    // Adjust the input lightness relative to the corrector
    lightness = lightness < 0.5 ? lightness * corrector * 2 : corrector + (lightness - 0.5) * (1 - corrector) * 2;
    
    return hsl(hue, saturation, lightness);
}

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
 */
export function parseColor(color) {
    if (/^#[0-9a-f]{3,8}$/i.test(color)) {
        let result;

        if (color.length < 6) {
            const r = color[1],
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
 * @param h Hue [0, 1]
 * @param s Saturation [0, 1]
 * @param l Lightness [0, 1]
 */
export function hsl(h, s, l) {
    // Based on http://www.w3.org/TR/2011/REC-css3-color-20110607/#hsl-color
    let result;

    if (s == 0) {
        const partialHex = decToHex(l * 255);
        result = partialHex + partialHex + partialHex;
    }
    else {
        const m2 = l <= 0.5 ? l * (s + 1) : l + s - l * s,
              m1 = l * 2 - m2;
        result =
            hueToRgb(m1, m2, h * 6 + 2) +
            hueToRgb(m1, m2, h * 6) +
            hueToRgb(m1, m2, h * 6 - 2);
    }

    return "#" + result;
}

// This function will correct the lightness for the "dark" hues
export function correctedHsl(h, s, l) {
    // The corrector specifies the perceived middle lightness for each hue
    const correctors = [ 0.55, 0.5, 0.5, 0.46, 0.6, 0.55, 0.55 ],
          corrector = correctors[(h * 6 + 0.5) | 0];
    
    // Adjust the input lightness relative to the corrector
    l = l < 0.5 ? l * corrector * 2 : corrector + (l - 0.5) * (1 - corrector) * 2;
    
    return hsl(h, s, l);
}

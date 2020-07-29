import canvasRenderer from "canvas-renderer";
import { iconGenerator } from "../renderer/iconGenerator";
import { isValidHash, computeHash } from "../common/hashUtils";
import { getConfiguration } from "../common/configuration";
import { CanvasRenderer } from "../renderer/canvas/index";

/**
 * Draws an identicon as PNG.
 * @param {*} hashOrValue - A hexadecimal hash string or any value that will be hashed by Jdenticon.
 * @param {number} size - Icon size in pixels.
 * @param {Object|number=} config - Optional configuration. If specified, this configuration object overrides any
 *    global configuration in its entirety. For backward compatibility a padding value in the range [0.0, 0.5) can be
 *    specified in place of a configuration object.
 * @returns {Buffer} PNG data
 */
export function toPng(hashOrValue, size, config) {
    const canvas = canvasRenderer.createCanvas(size, size);
    const ctx = canvas.getContext("2d");
    
    iconGenerator(new CanvasRenderer(ctx, size), 
        isValidHash(hashOrValue) || computeHash(hashOrValue), 
        getConfiguration(config, 0.08));
    
    return canvas.toPng({ "Software": "Jdenticon" });
}
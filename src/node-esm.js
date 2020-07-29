/**
 * Jdenticon
 * https://github.com/dmester/jdenticon
 * Copyright © Daniel Mester Pirttijärvi
 */

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

export { configure } from "./apis/configure";
export { drawIcon } from "./apis/drawIcon";
export { toPng } from "./apis/toPng";
export { toSvg } from "./apis/toSvg";

/**
 * Specifies the version of the Jdenticon package in use.
 * @type {string}
 */
export const version = "#version#";

/**
 * Specifies which bundle of Jdenticon that is used.
 * @type {string}
 */
export const bundle = "node-esm";

/**
 * @throws {Error}
 */
export function update() {
    throw new Error("jdenticon.update() is not supported on Node.js.");
}

/**
 * @throws {Error}
 */
export function updateCanvas() {
    throw new Error("jdenticon.updateCanvas() is not supported on Node.js.");
}

/**
 * @throws {Error}
 */
export function updateSvg() {
    throw new Error("jdenticon.updateSvg() is not supported on Node.js.");
}

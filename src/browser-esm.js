/**
 * Jdenticon
 * https://github.com/dmester/jdenticon
 * Copyright © Daniel Mester Pirttijärvi
 */

// This file is compiled to dist/jdenticon-module.mjs

export { configure } from "./apis/configure";
export { drawIcon } from "./apis/drawIcon";
export { toSvg } from "./apis/toSvg";
export { update, updateCanvas, updateSvg } from "./apis/update";

/**
 * Specifies the version of the Jdenticon package in use.
 * @type {string}
 */
export const version = "#version#";

/**
 * Specifies which bundle of Jdenticon that is used.
 * @type {string}
 */
export const bundle = "browser-esm";

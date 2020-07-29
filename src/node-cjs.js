/**
 * Jdenticon
 * https://github.com/dmester/jdenticon
 * Copyright © Daniel Mester Pirttijärvi
 */

// This file is compiled to dist/jdenticon-node.js

if (typeof process === "undefined" &&
    typeof window !== "undefined" &&
    typeof document !== "undefined"
) {
    console.warn(
        "Jdenticon: 'dist/jdenticon-node.js' is only intended for Node.js environments and will increase your " +
        "bundle size when included in browser bundles. If you want to run Jdenticon in the browser, please add a " +
        "reference to 'dist/jdenticon.js' or 'dist/jdenticon.min.js' instead.");
}

import { defineConfigPropertyWithWarn } from "./common/configuration";
import { configure } from "./apis/configure";
import { drawIcon } from "./apis/drawIcon";
import { toPng } from "./apis/toPng";
import { toSvg } from "./apis/toSvg";

/**
 * @throws {Error}
 */
function jdenticon() {
    throw new Error("jdenticon() is not supported on Node.js.");
}

defineConfigPropertyWithWarn(jdenticon);

jdenticon.configure = configure;
jdenticon.drawIcon = drawIcon;
jdenticon.toPng = toPng;
jdenticon.toSvg = toSvg;

/**
 * Specifies the version of the Jdenticon package in use.
 * @type {string}
 */
jdenticon.version = "#version#";

/**
 * Specifies which bundle of Jdenticon that is used.
 * @type {string}
 */
jdenticon.bundle = "node-cjs";

/**
 * @throws {Error}
 */
jdenticon.update = function update() {
    throw new Error("jdenticon.update() is not supported on Node.js.");
};

/**
 * @throws {Error}
 */
jdenticon.updateCanvas = function updateCanvas() {
    throw new Error("jdenticon.updateCanvas() is not supported on Node.js.");
};

/**
 * @throws {Error}
 */
jdenticon.updateSvg = function updateSvg() {
    throw new Error("jdenticon.updateSvg() is not supported on Node.js.");
};

module.exports = jdenticon;
/**
 * Jdenticon
 * https://github.com/dmester/jdenticon
 * Copyright © Daniel Mester Pirttijärvi
 */

// This file is compiled to dist/jdenticon-module.js

import { defineConfigProperty } from "./common/configuration";
import { configure } from "./apis/configure";
import { drawIcon } from "./apis/drawIcon";
import { toSvg } from "./apis/toSvg";
import { update, updateAll, updateCanvas, updateSvg } from "./apis/update";

const jdenticon = updateAll;

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
jdenticon["version"] = "#version#";

/**
 * Specifies which bundle of Jdenticon that is used.
 * @type {string}
 */
jdenticon["bundle"] = "browser-cjs";

module.exports = jdenticon;
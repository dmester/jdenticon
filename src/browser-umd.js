/**
 * Jdenticon
 * https://github.com/dmester/jdenticon
 * Copyright © Daniel Mester Pirttijärvi
 */

// This file is compiled to dist/jdenticon.js and dist/jdenticon.min.js

import { CONFIG_PROPERTIES, defineConfigProperty } from "./common/configuration";
import { observer } from "./common/observer";
import { configure } from "./apis/configure";
import { drawIcon } from "./apis/drawIcon";
import { toSvg } from "./apis/toSvg";
import { update, updateAll, updateAllConditional } from "./apis/update";
import { jdenticonJqueryPlugin } from "./apis/jquery";
import { GLOBAL } from "./common/global";
import { whenDocumentIsReady } from "./common/dom";

const jdenticon = updateAll;

defineConfigProperty(jdenticon);

// Export public API
jdenticon["configure"] = configure;
jdenticon["drawIcon"] = drawIcon;
jdenticon["toSvg"] = toSvg;
jdenticon["update"] = update;
jdenticon["updateCanvas"] = update;
jdenticon["updateSvg"] = update;

/**
 * Specifies the version of the Jdenticon package in use.
 * @type {string}
 */
jdenticon["version"] = "#version#";

/**
 * Specifies which bundle of Jdenticon that is used.
 * @type {string}
 */
jdenticon["bundle"] = "browser-umd";

// Basic jQuery plugin
const jQuery = GLOBAL["jQuery"];
if (jQuery) {
    jQuery["fn"]["jdenticon"] = jdenticonJqueryPlugin;
}

/**
 * This function is called once upon page load.
 */
function jdenticonStartup() {
    const replaceMode = (
        jdenticon[CONFIG_PROPERTIES.MODULE] ||
        GLOBAL[CONFIG_PROPERTIES.GLOBAL] ||
        { }
    )["replaceMode"];
    
    if (replaceMode != "never") {
        updateAllConditional();
        
        if (replaceMode == "observe") {
            observer(update);
        }
    }
}

// Schedule to render all identicons on the page once it has been loaded.
whenDocumentIsReady(jdenticonStartup);

module.exports = jdenticon;

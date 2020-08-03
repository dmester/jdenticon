import { configure, drawIcon, update, updateSvg, updateCanvas, toPng, toSvg, JdenticonConfig } from "../../../";

const newConfig: JdenticonConfig = {
    lightness: {
        color: [0.40, 0.80],
        grayscale: [0.30, 0.90]
    },
    saturation: {
        color: 0.50,
        grayscale: 0.00
    },
    hues: [45, 677],
    padding: 0.3,
    replaceMode: "observe",
    backColor: "#86444400"
};

const oldConfig: JdenticonConfig = {
    lightness: {
        color: [0.4, 0.8],
        grayscale: [0.3, 0.9]
    },
    saturation: 0.5
};

window.jdenticon_config = oldConfig;

configure(oldConfig);

toPng("value to hash", 100);
toSvg("value to hash", 100);

toPng("value to hash", 100, 0.08);
toSvg("value to hash", 100, 0.08);

toPng("value to hash", 100, newConfig);
toSvg("value to hash", 100, newConfig);

var el = document.createElement("canvas");
update(el, "value");
update(el, "value", 0.08);
update(el, "value", newConfig);
update("#selector", "value");
update("#selector", "value", 0.08);
update("#selector", "value", newConfig);

updateSvg("#selector", "value", newConfig);
updateCanvas("#selector", "value", newConfig);

var ctx = el.getContext("2d");
if (ctx) {
    drawIcon(ctx, "value", 100);
    drawIcon(ctx, "value", 100, 0.08);
    drawIcon(ctx, "value", 100, newConfig);
}

// Ensure Jdenticon dodn't leak Node typings.
// setTimeout returns a NodeJS.Timeout when the Node typings are loaded.
const timeoutRef: number = setTimeout(() => { }, 100);

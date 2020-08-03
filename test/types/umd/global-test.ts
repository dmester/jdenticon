
const config: JdenticonConfig = {
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

window.jdenticon_config = config;

jdenticon.configure(config);

jdenticon.toPng("value to hash", 100);
jdenticon.toSvg("value to hash", 100);

jdenticon.toPng("value to hash", 100, 0.08);
jdenticon.toSvg("value to hash", 100, 0.08);

jdenticon.toPng("value to hash", 100, config);
jdenticon.toSvg("value to hash", 100, config);

var el = document.createElement("canvas");
jdenticon.update(el, "value");
jdenticon.update(el, "value", 0.08);
jdenticon.update(el, "value", config);
jdenticon.update("#selector", "value");
jdenticon.update("#selector", "value", 0.08);
jdenticon.update("#selector", "value", config);

jdenticon.updateSvg("#selector", "value", config);
jdenticon.updateCanvas("#selector", "value", config);

jdenticon();

var ctx = el.getContext("2d");
if (ctx) {
    jdenticon.drawIcon(ctx, "value", 100);
    jdenticon.drawIcon(ctx, "value", 100, 0.08);
    jdenticon.drawIcon(ctx, "value", 100, config);
}

// Ensure Jdenticon dodn't leak Node typings.
// setTimeout returns a NodeJS.Timeout when the Node typings are loaded.
const timeoutRef1: number = setTimeout(() => { }, 100);
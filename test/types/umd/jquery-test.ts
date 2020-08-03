/// <reference types="jquery" />

const jqueryConfig: JdenticonConfig = {
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

$("canvas").jdenticon("value");
$("canvas").jdenticon("value", 0.08);
$("canvas").jdenticon("value", jqueryConfig);

// Ensure Jdenticon dodn't leak Node typings.
// setTimeout returns a NodeJS.Timeout when the Node typings are loaded.
const timeoutRef2: number = setTimeout(() => { }, 100);

import { nodeResolve } from "@rollup/plugin-node-resolve";
import { terser } from "rollup-plugin-terser";

export default {
    input: "./app.js",
    output: {
        file: "./app.bundle.js",
        format: 'iife',
    },
    plugins: [
        nodeResolve({
            browser: true,
        }),
        terser(),
    ],
};
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import { terser } from "rollup-plugin-terser";

export default {
    input: "./app.js",
    output: {
        file: "./app.bundle.js",
        format: "iife",
        globals: {
            "canvas-renderer": "{}",
        },
    },
    external: ["canvas-renderer"],
    plugins: [
        commonjs(),
        nodeResolve({
            browser: true,
        }),
        terser(),
    ],
};
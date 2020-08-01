/**
 * Jdenticon
 * https://github.com/dmester/jdenticon
 * Copyright © Daniel Mester Pirttijärvi
 */

const { rollup } = require("rollup");
const Vinyl = require("vinyl");
const applySourceMap = require("vinyl-sourcemaps-apply");
const { Transform } = require("stream");

function rollupStream(options) {
    return new Transform({
        objectMode: true,

        transform(inputFile, _, fileDone) {
            const inputOptions = {
                onwarn: warn => console.warn(warn.toString()),
                ...options,
                input: inputFile.path,
            };
            delete inputOptions.output;

            rollup(inputOptions).then(bundle => {
                return bundle.generate({
                    ...options.output,
                    sourcemap: !!inputFile.sourceMap
                });

            }).then(outputs => {

                for (const output of outputs.output) {
                    if (output.type === "chunk") {
                        const outputFile = new Vinyl({
                            cwd: inputFile.cwd,
                            base: inputFile.base,
                            path: inputFile.path,
                            contents: Buffer.from(output.code),
                        });

                        if (inputFile.sourceMap) {
                            applySourceMap(outputFile, output.map);
                        }

                        this.push(outputFile);
                    }
                }

                fileDone();
                
            }, err => fileDone(err));
        }
    });
}

module.exports = rollupStream;

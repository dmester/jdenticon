const { Transform } = require("stream");
const { parse } = require("acorn");
const { Replacement } = require("./replacement");

function astTransformStream(transformer) {
    return new Transform({
        objectMode: true,

        transform(inputFile, _, fileDone) {
            const input = inputFile.contents.toString();
            
            const comments = [];
            const ast = parse(input, {
                ecmaVersion: 10,
                sourceType: "module",
                onComment: comments,
            });

            const replacement = new Replacement();
            transformer(replacement, ast, comments, input);
            const output = replacement.replace(input, inputFile.sourceMap);
            
            inputFile.contents = Buffer.from(output.output);

            if (inputFile.sourceMap) {
                inputFile.sourceMap = output.sourceMap;
            }

            fileDone(null, inputFile);
        }
    });
}

module.exports = transformer => () => astTransformStream(transformer);

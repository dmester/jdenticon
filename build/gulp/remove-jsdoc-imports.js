const astTransformStream = require("./ast-transform-stream");

function removeJSDocImports(comments, replacement) {
    const REGEX = /[ \t]*\*[ \t]*@typedef\s+\{import.+\r?\n?|import\(.*?\)\.([a-zA-Z_]+)/g;
    const JSDOC_COMMENT_OFFSET = 2;

    comments.forEach(comment => {
        if (comment.type === "Block" && comment.value[0] === "*") {
            // JSDoc comment
            const resultingComment = comment.value.replace(REGEX, (match, importName, matchIndex) => {
                matchIndex += comment.start + JSDOC_COMMENT_OFFSET;

                if (importName) {
                    // { import().xxx }
                    replacement.addRange({
                        start: matchIndex,
                        end: matchIndex + match.length,
                        replacement: importName,
                    });

                    return importName;
                    
                } else {
                    // @typedef
                    replacement.addRange({
                        start: matchIndex,
                        end: matchIndex + match.length,
                        replacement: "",
                    });

                    return "";
                }
            });

            if (!/[^\s\*]/.test(resultingComment)) {
                // Empty comment left
                replacement.addRange({
                    start: comment.start,
                    end: comment.end,
                    replacement: "",
                });
            }
        }
    });
}

module.exports = astTransformStream(function (replacement, ast, comments, input) {
    removeJSDocImports(comments, replacement);
});




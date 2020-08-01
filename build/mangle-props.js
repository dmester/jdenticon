/**
 * Jdenticon
 * https://github.com/dmester/jdenticon
 * Copyright © Daniel Mester Pirttijärvi
 */

const { Transform } = require("stream");
const { parse, Node } = require("acorn");
const { Replacement } = require("./replacement");
const DOMPROPS = require("./domprops");
const RESERVED_NAMES = require("./reserved-keywords");

const CHARACTERS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_";

function generateIdentifier(seed) {
    let identifier = "";

    seed = Math.abs(Math.floor(seed));

    do {
        const mod = seed % CHARACTERS.length;
        identifier += CHARACTERS[mod];
        seed = (seed / CHARACTERS.length) | 0;
    } while (seed);

    return identifier;
}

function visit(node, identifierNodes) {
    if (node instanceof Node) {
        let identifier;

        if (node.type === "MemberExpression" && !node.computed) {
            // Matches x.y
            // Not x["y"] (computed: true)
            identifier = node.property;
        } else if (node.type === "MethodDefinition") {
            // Matches x() { }
            identifier = node.key;
        } else if (node.type === "Property") {
            // Matches { x: y }
            // Not { "x": y }
            identifier = node.key;
        }

        if (identifier && identifier.type === "Identifier") {
            identifierNodes.push(identifier);
        }
    }

    for (const key in node) {
        const value = node[key];
        if (Array.isArray(value)) {
            value.forEach(subNode => visit(subNode, identifierNodes));
        } else if (value instanceof Node) {
            visit(value, identifierNodes);
        }
    }
}

function createReplacement(identifierNodes) {
    const longToShortName = new Map();
    const replacement = new Replacement();
    
    // Collect usage statistics per name
    const usageMap = new Map();
    identifierNodes.forEach(node => {
        if (node.name && !RESERVED_NAMES.has(node.name) && !DOMPROPS.has(node.name)) {
            usageMap.set(node.name, (usageMap.get(node.name) || 0) + 1);
        }
    });
    
    // Sort by usage in descending order
    const usageStats = Array.from(usageMap).sort((a, b) => b[1] - a[1]);

    // Allocate identifiers in order of usage statistics to ensure
    // frequently used symbols get as short identifiers as possible.
    let runningCounter = 0;
    usageStats.forEach(identifier => {
        const longName = identifier[0];
        
        if (!longToShortName.has(longName)) {
            let shortName;

            do {
                shortName = generateIdentifier(runningCounter++);
            } while (RESERVED_NAMES.has(shortName) || DOMPROPS.has(shortName));

            longToShortName.set(longName, shortName);
        }
    });

    // Populate replacements
    identifierNodes.forEach(node => {
        const minifiedName = longToShortName.get(node.name);
        if (minifiedName) {
            replacement.addRange({
                start: node.start,
                end: node.end,
                replacement: minifiedName + "/*" + node.name + "*/",
                name: node.name,
            });
        }
    });

    return replacement;
}

function manglePropsStream() {
    return new Transform({
        objectMode: true,

        transform(inputFile, _, fileDone) {
            
            const input = inputFile.contents.toString();
            
            const ast = parse(input, {
                ecmaVersion: 10,
                sourceType: "module",
            });
        
            const identifierNodes = [];
            visit(ast, identifierNodes);

            const replacement = createReplacement(identifierNodes);
            const output = replacement.replace(input, inputFile.sourceMap);
            
            inputFile.contents = Buffer.from(output.output);

            if (inputFile.sourceMap) {
                inputFile.sourceMap = output.sourceMap;
            }

            fileDone(null, inputFile);
        }
    });
}

module.exports = manglePropsStream;


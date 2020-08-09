const { Node } = require("acorn");
const astTransformStream = require("./ast-transform-stream");
const DOMPROPS = require("./domprops");
const RESERVED_NAMES = require("./reserved-keywords");

const CHARACTERS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_";

function visit(node, visitor) {
    if (node instanceof Node) {
        visitor(node);
    }

    for (const key in node) {
        const value = node[key];
        if (Array.isArray(value)) {
            value.forEach(subNode => visit(subNode, visitor));
        } else if (value instanceof Node) {
            visit(value, visitor);
        }
    }
}

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

function mangleProps(input, ast, replacement) {
    const identifierNodes = [];
    const longToShortName = new Map();

    // Find identifiers
    visit(ast, node => {
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
    });
    
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

function simplifyES5Class(input, ast, replacement) {
    const prototypeMemberExpressions = [];
    const duplicateNamedFunctions = [];

    visit(ast, node => {
        if (node.type === "MemberExpression" &&
            !node.computed &&
            node.object.type === "Identifier" &&
            node.property.type === "Identifier" &&
            node.property.name === "prototype"
        ) {
            // Matches: xxx.prototype
            prototypeMemberExpressions.push(node);
            
        } else if (
            node.type === "VariableDeclaration" &&
            node.declarations.length === 1 &&
            node.declarations[0].init &&
            node.declarations[0].init.type === "FunctionExpression" &&
            node.declarations[0].init.id &&
            node.declarations[0].init.id.name === node.declarations[0].id.name
            ) {
            // Matches: var xxx = function xxx ();
            duplicateNamedFunctions.push(node);
        }
    });

    duplicateNamedFunctions.forEach(duplicateNamedFunction => {
        const functionName = duplicateNamedFunction.declarations[0].init.id.name;

        // Remove: var xxx =
        replacement.addRange({
            start: duplicateNamedFunction.start,
            end: duplicateNamedFunction.declarations[0].init.start,
            replacement: "",
        });

        // Remove trailing semicolons
        let semicolons = 0;
        while (input[duplicateNamedFunction.end - semicolons - 1] === ";") semicolons++;
        
        // Find prototype references
        const refs = prototypeMemberExpressions.filter(node => node.object.name === functionName);
        if (refs.length > 1) {

            // Insert: var xx__prototype = xxx.prototype;
            replacement.addRange({
                start: duplicateNamedFunction.end - semicolons,
                end: duplicateNamedFunction.end,
                replacement: `\r\nvar ${functionName}__prototype = ${functionName}.prototype;`,
            });

            // Replace references
            refs.forEach(ref => {
                replacement.addRange({
                    start: ref.start,
                    end: ref.end,
                    replacement: `${functionName}__prototype`,
                });
            });
        } else if (semicolons) {
            replacement.addRange({
                start: duplicateNamedFunction.end - semicolons,
                end: duplicateNamedFunction.end,
                replacement: "",
            });
        }
    });
}

function browserConstants(input, ast, replacement) {
    replacement.addText("Node.ELEMENT_NODE", "1");
}

const MINIFIERS = [simplifyES5Class, mangleProps, browserConstants];

module.exports = astTransformStream(function (replacement, ast, comments, input) {
    MINIFIERS.forEach(minifier => minifier(input, ast, replacement));
});


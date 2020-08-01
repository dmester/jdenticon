/**
 * Jdenticon
 * https://github.com/dmester/jdenticon
 * Copyright © Daniel Mester Pirttijärvi
 */

const { Transform } = require("stream");
const { SourceMapConsumer, SourceMapGenerator } = require("source-map");

/**
 * Finds substrings and replaces them with other strings, keeping any input source map up-to-date.
 * 
 * @example
 * const replacement = new Replacement([
 *    ["find this", "replace with this"],
 *    [/find this/gi, "replace with this"]
 * ]);
 * replacement.replace(input, inputSourceMap);
 * 
 * @example
 * const replacement = new Replacement("find this", "replace with this");
 * replacement.replace(input, inputSourceMap);
 */
class Replacement {
    constructor(...definition) {
        /**
         * @type {function(Array<OverwriteRange>, string): void}
         */
        this._matchers = [];

        /**
         * @type {Array<OverwriteRange>}
         */
        this._ranges = [];

        this.add(definition);
    }

    /**
     * @param {string} input 
     * @returns {Array<OverwriteRange>}
     */
    matchAll(input) {
        const ranges = [...this._ranges];
        this._matchers.forEach(matcher => matcher(ranges, input));

        let lastReplacement;
        
        return ranges
            .sort((a, b) => a.start - b.start)
            .filter(replacement => {
                if (!lastReplacement || lastReplacement.end < replacement.start) {
                    lastReplacement = replacement;
                    return true;
                }
            });
    }

    /**
     * @param {string} input 
     * @param {SourceMap=} inputSourceMap 
     * @returns {{ output: string, sourceMap: SourceMap }}
     */
    replace(input, inputSourceMap) {
        const ranges = this.matchAll(input);
        const offset = new Offset();
        const reader = new InputReader(input);
        const sourceMap = new SourceMapSpooler(inputSourceMap);
        const output = [];
    
        if (sourceMap.isEmpty()) {
            sourceMap.initEmpty(reader.lines);
        }
        
        ranges.forEach(range => {
            output.push(reader.readTo(range.start));
            output.push(range.replacement);

            const inputStart = reader.pos;
            
            const replacedText = reader.readTo(range.end);
            if (replacedText === range.replacement) {
                return; // Nothing to do
            }

            const inputEnd = reader.pos;
            
            const replacementLines = range.replacement.split(/\n/g);
            const lineDifference = replacementLines.length + inputStart.line - inputEnd.line - 1;
    
            const outputStart = {
                line: inputStart.line + offset.lineOffset,
                column: inputStart.column + offset.getColumnOffset(inputStart.line)
            };
            const outputEnd = {
                line: inputEnd.line + offset.lineOffset + lineDifference,
                column: replacementLines.length > 1 ? 
                    replacementLines[replacementLines.length - 1].length :
                    inputEnd.column + offset.getColumnOffset(inputEnd.line) + 
                    range.replacement.length - range.end + range.start
            }
    
            sourceMap.spoolTo(inputStart.line, inputStart.column, offset);
            sourceMap.skipTo(inputStart.line, inputStart.column + 1, offset);
            
            offset.lineOffset += lineDifference;
            offset.setColumnOffset(inputEnd.line, outputEnd.column - inputEnd.column);
    
            if (range.name || replacementLines.length === 1) {
                const mappingBeforeStart = sourceMap.lastMapping();
    
                if (mappingBeforeStart && mappingBeforeStart.generatedLine === inputStart.line) {
                    sourceMap.addMapping({
                        original: {
                            line: mappingBeforeStart.originalLine + inputStart.line - mappingBeforeStart.generatedLine,
                            column: mappingBeforeStart.originalColumn + inputStart.column - mappingBeforeStart.generatedColumn,
                        },
                        generated: {
                            line: outputStart.line,
                            column: outputStart.column
                        },
                        source: mappingBeforeStart.source,
                        name: range.name,
                    });
                }
    
            } else {
                // Map longer replacements to a virtual file defined in the source map
                const generatedSourceName = sourceMap.addSourceContent(replacedText, range.replacement);
                
                for (var i = 0; i < replacementLines.length; i++) {
                    sourceMap.addMapping({
                        original: {
                            line: i + 1,
                            column: 0,
                        },
                        generated: {
                            line: outputStart.line + i,
                            column: i ? 0 : outputStart.column,
                        },
                        source: generatedSourceName,
                    });
                }
    
            }
    
            sourceMap.skipTo(inputEnd.line, inputEnd.column, offset);
    
            // Add a source map node directly after the replacement to terminate the replacement
            const nextMapping = sourceMap.nextMapping();
            const mappingBeforeEnd = sourceMap.lastMapping();
    
            if (nextMapping &&
                nextMapping.generatedLine === inputEnd.line &&
                nextMapping.generatedColumn === inputEnd.column
            ) {
                // No extra source map node needed when the replacement is directly followed by another node
    
            } else if (mappingBeforeEnd && mappingBeforeEnd.generatedLine === inputEnd.line) {
                sourceMap.addMapping({
                    original: {
                        line: mappingBeforeEnd.originalLine + inputEnd.line - mappingBeforeEnd.generatedLine,
                        column: mappingBeforeEnd.originalColumn + inputEnd.column - mappingBeforeEnd.generatedColumn,
                    },
                    generated: {
                        line: outputEnd.line,
                        column: outputEnd.column
                    },
                    source: mappingBeforeEnd.source,
                });
            }
    
        });
    
        // Flush remaining input to output and source map
        output.push(reader.readToEnd());
        sourceMap.spoolToEnd(offset);
    
        return {
            output: output.join(""),
            sourceMap: sourceMap.toJSON(),
        };
    }

    add(value) {
        const target = this;
    
        function addRecursive(innerValue) {
            if (innerValue != null) {
                if (Array.isArray(innerValue)) {
                    const needle = innerValue[0];

                    if (typeof needle === "string") {
                        target.addText(...innerValue);
                    } else if (needle instanceof RegExp) {
                        target.addRegExp(...innerValue);
                    } else {
                        innerValue.forEach(addRecursive);
                    }
        
                } else if (innerValue instanceof Replacement) {
                    target._matchers.push(innerValue._matchers);
                    target._ranges.push(innerValue._ranges);
                
                } else if (typeof innerValue === "object") {
                    target.addRange(innerValue);
                
                } else {
                    throw new Error("Unknown replacement argument specified.");
                }
            }
        }

        addRecursive(value);
    }

    /**
     * @param {RegExp} re 
     * @param {string|function(string, ...):string} replacement 
     * @param {{ name: string }=} rangeOpts 
     */
    addRegExp(re, replacement, rangeOpts) {
        const replacementFactory = this._createReplacementFactory(replacement);

        this._matchers.push((ranges, input) => {
            const isGlobalRegExp = /g/.test(re.flags);
    
            let match;
            let isFirstIteration = true;

            while ((isFirstIteration || isGlobalRegExp) && (match = re.exec(input))) {
                ranges.push(new OverwriteRange({
                    ...rangeOpts,
                    start: match.index,
                    end: match.index + match[0].length,
                    replacement: replacementFactory(match, match.index, input),
                }));
                isFirstIteration = false;
            }
        });
    }

    /**
     * @param {string} needle
     * @param {string|function(string, ...):string} replacement 
     * @param {{ name: string }=} rangeOpts 
     */
    addText(needle, replacement, rangeOpts) {
        const replacementFactory = this._createReplacementFactory(replacement);

        this._matchers.push((ranges, input) => {
            let index = -needle.length;
                    
            while ((index = input.indexOf(needle, index + needle.length)) >= 0) {
                ranges.push(new OverwriteRange({
                    ...rangeOpts,
                    start: index,
                    end: index + needle.length,
                    replacement: replacementFactory([needle], index, input),
                }));
            }
        });
    }

    /**
     * @param {OverwriteRange} range 
     */
    addRange(range) {
        this._ranges.push(new OverwriteRange(range));
    }

    /**
     * @param {string|function(string, ...):string} replacement 
     * @returns {function(Array<string>, number, string):string}
     */
    _createReplacementFactory(replacement) {
        if (typeof replacement === "function") {
            return (match, index, input) => replacement(...match, index, input);
        }

        if (replacement == null) {
            return () => "";
        }

        replacement = replacement.toString();

        if (replacement.indexOf("$") < 0) {
            return () => replacement;
        }

        return (match, index, input) =>
            replacement.replace(/\$(\d+|[$&`'])/g, matchedPattern => {
                if (matchedPattern === "$$") {
                    return "$";
                }
                if (matchedPattern === "$&") {
                    return match[0];
                }
                if (matchedPattern === "$`") {
                    return input.substring(0, index);
                }
                if (matchedPattern === "$'") {
                    return input.substring(index + match[0].length);
                }

                const matchArrayIndex = Number(matchedPattern.substring(1));
                return match[matchArrayIndex];
            });
    }
}

class InputReader {
    /**
     * @param {string} input 
     */
    constructor (input) {
        // Find index of all line breaks
        const lineBreakIndexes = [];
        let index = -1;
        while ((index = input.indexOf("\n", index + 1)) >= 0) {
            lineBreakIndexes.push(index);
        }

        this._input = input;
        
        this._inputCursorExclusive = 0;
        this._output = [];
        this._lineBreakIndexes = lineBreakIndexes;

        /**
         * Number of lines in the input file.
         * @type {number}
         */
        this.lines = this._lineBreakIndexes.length + 1;

        /**
         * Position of the input cursor. Line number is one-based and column number is zero-based.
         * @type {{ line: number, column: number }}
         */
        this.pos = { line: 1, column: 0 };
    }

    readTo(exclusiveIndex) {
        let result = "";

        if (this._inputCursorExclusive < exclusiveIndex) {
            result = this._input.substring(this._inputCursorExclusive, exclusiveIndex);
            this._inputCursorExclusive = exclusiveIndex;
            this._updatePos();
        }

        return result;
    }

    readToEnd() {
        return this.readTo(this._input.length);
    }

    _updatePos() {
        let line = this.pos.line;
        while (
            line - 1 < this._lineBreakIndexes.length &&
            this._lineBreakIndexes[line - 1] < this._inputCursorExclusive
        ) {
            line++;
        }

        const lineStartIndex = this._lineBreakIndexes[line - 2];
        const column = this._inputCursorExclusive - (lineStartIndex || 0) - 1;
        this.pos = { line, column };
    }
}

class SourceMapSpooler {
    /**
     * @param {SourceMap=} inputSourceMap
     */
    constructor(inputSourceMap) {
        let generator;
        let file;
        let sources;
        let mappings = [];

        if (inputSourceMap) {
            if (!(inputSourceMap instanceof SourceMapConsumer)) {
                inputSourceMap = new SourceMapConsumer(inputSourceMap);
            }
    
            generator = new SourceMapGenerator({
                file: inputSourceMap.file,
                sourceRoot: inputSourceMap.sourceRoot,
            });
    
            inputSourceMap.sources.forEach(function(sourceFile) {
                const content = inputSourceMap.sourceContentFor(sourceFile);
                if (content != null) {
                    generator.setSourceContent(sourceFile, content);
                }
            });
    
            inputSourceMap.eachMapping(mapping => {
                mappings.push(mapping);
            });
    
            mappings.sort((a, b) => a.generatedLine == b.generatedLine
                ? a.generatedColumn - b.generatedColumn : a.generatedLine - b.generatedLine);

            file = inputSourceMap.file;
            sources = inputSourceMap.sources;
            
        } else {
            generator = new SourceMapGenerator();
            file = "input";
            sources = [];
        }

        this._generator = generator;
        this._sources = sources;
        this._file = file;
        
        this._mappingsCursor = 0;
        this._mappings = mappings;

        this._contents = new Map();
    }

    lastMapping() {
        return this._mappings[this._mappingsCursor - 1];
    }

    nextMapping() {
        return this._mappings[this._mappingsCursor];
    }

    addMapping(mapping) {
        this._generator.addMapping(mapping);
    }

    isEmpty() {
        return this._mappings.length === 0;
    }

    initEmpty(lines) {
        this._mappings = [];

        for (var i = 0; i < lines; i++) {
            this._mappings.push({
                originalLine: i + 1,
                originalColumn: 0,
                generatedLine: i + 1,
                generatedColumn: 0,
                source: this._file
            });
        }
    }

    addSourceContent(replacedText, content) {
        let sourceName = this._contents.get(content);

        if (!sourceName) {
            const PREFIX = "replacement/";
            
            let sourceNameWithoutNumber = PREFIX;
            sourceName = sourceNameWithoutNumber + "1";

            if (replacedText.length > 0 && replacedText.length < 25) {
                replacedText = replacedText
                    .replace(/^[^0-9a-z-_]+|[^0-9a-z-_]+$/ig, "")
                    .replace(/\s+/g, "-")
                    .replace(/[^0-9a-z-_]/ig, "");
                    
                if (replacedText) {
                    sourceNameWithoutNumber = PREFIX + replacedText;
                    sourceName = sourceNameWithoutNumber;
                }
            }
            
            let counter = 2;
            while (this._sources.includes(sourceName)) {
                sourceName = sourceNameWithoutNumber + "-" + counter++;
            }
            
            this._contents.set(content, sourceName);
            this._generator.setSourceContent(sourceName, content);
        }

        return sourceName;
    }

    /**
     * Copies source map info from input to output up to but not including the specified position.
     * @param {number} line 
     * @param {number} column 
     * @param {Offset} offset 
     */
    spoolTo(line, column, offset) {
        this._consume(line, column, offset, true);
    }

    /**
     * Copies remaining source map info from input to output.
     * @param {number} line 
     * @param {number} column 
     * @param {Offset} offset 
     */
    spoolToEnd(offset) {
        this._consume(null, null, offset, true);
    }

    /**
     * Discards source map info from input up to but not including the specified position.
     * @param {number} line 
     * @param {number} column 
     * @param {Offset} offset 
     */
    skipTo(line, column, offset) {
        this._consume(line, column, offset, false);
    }

    toJSON() {
        return this._generator.toJSON();
    }
    
    _consume(line, column, offset, keep) {
        let mapping;

        while (
            (mapping = this._mappings[this._mappingsCursor]) &&
            (
                line == null ||
                mapping.generatedLine < line ||
                mapping.generatedLine == line && mapping.generatedColumn < column
            )
        ) {
            if (keep) {
                this._generator.addMapping({
                    original: {
                        line: mapping.originalLine,
                        column: mapping.originalColumn,
                    },
                    generated: {
                        line: mapping.generatedLine + offset.lineOffset,
                        column: mapping.generatedColumn + offset.getColumnOffset(mapping.generatedLine),
                    },
                    source: mapping.source,
                    name: mapping.name,
                });
            }

            this._mappingsCursor++;
        }
    }

}

class Offset {
    constructor() {
        this.lineOffset = 0;
        this._columnOffset = 0;
        this._columnOffsetForLine = 0;
    }

    setColumnOffset(lineNumber, columnOffset) {
        this._columnOffsetForLine = lineNumber;
        this._columnOffset = columnOffset;
    }

    getColumnOffset(lineNumber) {
        return this._columnOffsetForLine === lineNumber ?
            this._columnOffset : 0;
    }
}

class OverwriteRange {
    constructor(options) {
        if (!isFinite(options.start)) {
            console.log(options)
            throw new Error("A replacement start index is required.");
        }
        if (!isFinite(options.end)) {
            throw new Error("A replacement end index is required.");
        }
        if (options.end < options.start) {
            throw new Error("Replacement end index cannot precede its start index.");
        }

        /**
         * Inclusive start index.
         * @type {number}
         */
        this.start = options.start;

        /**
         * Exclusive start index.
         * @type {number}
         */
        this.end = options.end;

        /**
         * The replacement interval will be replaced with this string.
         * @type string
         */
        this.replacement = "" + options.replacement;

        /**
         * Optional name that will be mapped in the source map.
         * @type string
         */
        this.name = options.name;
    }
}

function gulp(replacements) {
    if (typeof replacements === "string" || replacements instanceof RegExp) {
        replacements = Array.from(arguments);
    }

    const replacer = new Replacement(replacements);

    return new Transform({
        objectMode: true,

        transform(inputFile, _, fileDone) {
            const input = inputFile.contents.toString();

            const output = replacer.replace(input, inputFile.sourceMap);
            
            inputFile.contents = Buffer.from(output.output);

            if (inputFile.sourceMap) {
                inputFile.sourceMap = output.sourceMap;
            }

            fileDone(null, inputFile);
        }
    });
}

module.exports = { Replacement, gulp };

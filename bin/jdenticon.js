#!/usr/bin/env node

const fs = require("fs");
const jdenticon = require("../dist/jdenticon-node");


// Handle command

const parsedArgs = parseArgs(process.argv);

if (parsedArgs.help) {
    writeHelp();
    process.exit(0);

} else if (parsedArgs.version) {
    console.log(jdenticon.version);
    process.exit(0);

} else {
    const validatedArgs = validateArgs(parsedArgs);
    if (validatedArgs) {
        var output = validatedArgs.svg ?
            jdenticon.toSvg(validatedArgs.value, validatedArgs.size, validatedArgs.config) : 
            jdenticon.toPng(validatedArgs.value, validatedArgs.size, validatedArgs.config);

        if (validatedArgs.output) {
            fs.writeFileSync(validatedArgs.output, output);
        } else {
            process.stdout.write(output);
        }
        process.exit(0);

    } else {
        writeHelp();
        process.exit(1);
    }
}


// Functions

function writeHelp() {
    console.log("Generates an identicon as a PNG or SVG file for a specified value.");
    console.log("");
    console.log("Usage: jdenticon <value> [-s <size>] [-o <filename>]");
    console.log("");
    console.log("Options:");
    console.log("  -s, --size <value>        Icon size in pixels. (default: 100)");
    console.log("  -o, --output <path>       Output file. (default: <stdout>)");
    console.log("  -f, --format <svg|png>    Format of generated icon. Otherwise detected from output path. (default: png)");
    console.log("  -b, --back-color <value>  Background color on format #rgb, #rgba, #rrggbb or #rrggbbaa. (default: transparent)");
    console.log("  -p, --padding <value>     Padding in percent in range 0 to 0.5. (default: 0.08)");
    console.log("  --lightness-color <min,max>      Lightness range of colored shapes in [0,1]. (default: 0.4,0.8)");
    console.log("  --lightness-grayscale <min,max>  Lightness range of grayscale shapes in [0,1]. (default: 0.3,0.9)");
    console.log("  -v, --version             Gets the version of Jdenticon.");
    console.log("  -h, --help                Show this help information.");
    console.log("");
    console.log("Examples:");
    console.log("  jdenticon user127 -s 100 -o icon.png");
}

function parseArgs(args) {
    // Argument 1 is always node
    // Argument 2 is always jdenticon
    // Argument 3 and forward are actual arguments
    args = args.slice(2);

    function consume(aliases, hasValue) {
        for (var argIndex = 0; argIndex < args.length; argIndex++) {
            var arg = args[argIndex];
    
            for (var aliasIndex = 0; aliasIndex < aliases.length; aliasIndex++) {
                var alias = aliases[aliasIndex];
    
                if (arg === alias) {
                    var value;

                    if (hasValue) {
                        if (argIndex + 1 < args.length) {
                            value = args[argIndex + 1];
                        } else {
                            console.warn("WARN Missing value of argument " + alias);
                        }
                    } else {
                        value = true;
                    }
                    
                    args.splice(argIndex, hasValue ? 2 : 1);
                    return value;
                }
        
                if (arg.startsWith(alias) && arg[alias.length] === "=") {
                    var value = arg.substr(alias.length + 1);
                    if (!hasValue) {
                        value = value !== "false";
                    }
                    args.splice(argIndex, 1);
                    return value;
                }
            }
        }
    }

    if (consume(["-h", "--help", "-?", "/?", "/h"], false)) {
        return {
            help: true
        };
    }

    if (consume(["-v", "--version"], false)) {
        return {
            version: true
        };
    }

    return {
        size: consume(["-s", "--size"], true),
        output: consume(["-o", "--output"], true),
        format: consume(["-f", "--format"], true),
        padding: consume(["-p", "--padding"], true),
        backColor: consume(["-b", "--back-color"], true),
        lightnessColor: consume(["--lightness-color"], true),
        lightnessGrayscale: consume(["--lightness-grayscale"], true),
        value: args
    };
}

function parseLightnessRange(value) {
    var parts = value.split(",");
    if (parts.length !== 2) {
        return;
    }

    var min = Number(parts[0]);
    var max = Number(parts[1]);

    if (
        isNaN(min) || isNaN(max) ||
        min < 0 || min > 1 ||
        max < 0 || max > 1 ||
        min > max
    ) {
        return;
    }

    return [min, max];
}

function validateArgs(args) {
    if (args.value.length) {

        // Size
        var size = 100;
        if (args.size) {
            size = Number(args.size);
            if (!size || size < 1) {
                size = 100;
                console.warn("WARN Invalid size specified. Defaults to 100.");
            }
        }
        
        // Padding
        var padding;
        if (args.padding != null) {
            padding = Number(args.padding);
            if (isNaN(padding) || padding < 0 || padding >= 0.5) {
                padding = 0.08;
                console.warn("WARN Invalid padding specified. Defaults to 0.08.");
            }
        }
        
        // Background color
        var backColor;
        if (args.backColor != null) {
            backColor = args.backColor;
            if (!/^(#[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(backColor)) {
                backColor = undefined;
                console.warn("WARN Invalid background color specified. Defaults to transparent.");
            }
        }

        // Lightness
        var lightnessColor;
        if (args.lightnessColor != null) {
            lightnessColor =  parseLightnessRange(args.lightnessColor);
            if (!lightnessColor) {
                lightnessColor = [0.4, 0.8];
                console.warn("WARN Invalid lightness range of colored shapes specified. Defaults to 0.4,0.8.");
            }
        }

        var lightnessGrayscale;
        if (args.lightnessGrayscale != null) {
            lightnessGrayscale = parseLightnessRange(args.lightnessGrayscale);
            if (!lightnessGrayscale) {
                lightnessGrayscale = [0.3, 0.9];
                console.warn("WARN Invalid lightness range of grayscale shapes specified. Defaults to 0.3,0.9.");
            }
        }

        var lightness;
        if (lightnessColor || lightnessGrayscale) {
            lightness = {
                color: lightnessColor,
                grayscale: lightnessGrayscale
            };
        }

        // Format
        var generateSvg = 
            args.format ? /^svg$/i.test(args.format) :
            args.output ? /\.svg$/i.test(args.output) :
            false;
        if (args.format != null && !/^(svg|png)$/i.test(args.format)) {
            console.warn("WARN Invalid format specified. Defaults to " + (generateSvg ? "svg" : "png") + ".");
        }

        return {
            config: {
                padding: padding,
                backColor: backColor,
                lightness: lightness
            },
            output: args.output,
            size: size,
            svg: generateSvg,
            value: args.value.join("")
        };
    }
}

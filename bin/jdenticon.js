#!/usr/bin/env node

const fs = require("fs");
const jdenticon = require("../src/node");


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
                    var value = hasValue ? args[argIndex + 1] : true;
                    if (argIndex + 1 >= args.length) {
                        console.warn("WARN Missing value of argument " + alias);
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
        value: args
    };
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
                backColor: backColor
            },
            output: args.output,
            size: size,
            svg: generateSvg,
            value: args.value.join("")
        };
    }
}

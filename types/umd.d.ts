/// <reference path="env.d.ts"/>
/**
 * Jdenticon
 * https://github.com/dmester/jdenticon
 * Copyright © Daniel Mester Pirttijärvi
 */

declare global {
    interface JdenticonConfig {
        /**
         * Limits the possible hues in generated icons. The hues are specified as an array of hues in degrees. If the
         * option is omitted or an empty array is specified, all hues are allowed.
         */
        hues?: number[],
        /**
         * Specifies the lightness of the generated icon.
         */
        lightness?: {
            /**
             * Specifies the lightness range of colored shapes of an icon. The range is expressed as an array
             * containing two numbers, representing the minimum and maximum lightness in the range [0.0, 1.0].
             */
            color?: number[],
            /**
             * Specifies the lightness range of grayscale shapes of an icon. The range is expressed as an array
             * containing two numbers, representing the minimum and maximum lightness in the range [0.0, 1.0].
             */
            grayscale?: number[]
        },
        /**
         * Specifies the saturation of the generated icon.
         * 
         * For backward compatibility a single number can be specified instead of a `{ color, grayscale }`
         * object. This single number refers to the saturation of colored shapes.
         */
        saturation?: {
            /**
             * Specifies the saturation of originally colored shapes of an icon. The saturation is expressed as a
             * number in the range [0.0, 1.0].
             */
            color?: number,
            /**
             * Specifies the saturation of originally grayscale shapes of an icon. The saturation is expressed as a
             * number in the range [0.0, 1.0].
             */
            grayscale?: number
        } | number,
        /**
         * Specifies the padding surrounding the icon in percents in the range [0.0, 0.5).
         */
        padding?: number;
        /**
         * Specifies the background color to be rendered behind the icon.
         * 
         * Supported syntaxes are:
         *  * `"#rgb"`
         *  * `"#rgba"`
         *  * `"#rrggbb"`
         *  * `"#rrggbbaa"`
         */
        backColor?: string,
        /**
         * Specifies when icons will be rendered.
         * 
         *  * `"never"` – icons are never rendered automatically. You need to call `jdenticon.update()` manually to
         *    render identicons.
         * 
         *  * `"once"` – icons are rendered once the page has loaded. Any dynamically inserted or modified icons will
         *    not be rendered unless `jdenticon.update()` is manually called.
         * 
         *  * `"observe"` – icons are rendered upon page load, and the DOM is monitored for new icons using a 
         *    `MutationObserver`. Use this if icons are inserted dynamically, e.g. by using Angular, React or 
         *    VanillaJS. This option behaves as `"once"` in IE<11.
         * 
         * @remarks
         * This option has no effect in Node environments.
         */
        replaceMode?: "never" | "once" | "observe"
    }

    interface Jdenticon {
        /**
         * Updates all canvas elements with the `data-jdenticon-hash` or `data-jdenticon-value` attribute.
         * 
         * @remarks
         * This method is only available in the browser. Calling this method on Node.js will throw an error.
         */
        (): void;

        /**
         * Updates the identicon in the specified canvas or svg elements.
         * 
         * @remarks
         * This method is only available in the browser. Calling this method on Node.js will throw an error.
         * 
         * @param elementOrSelector Specifies the container in which the icon is rendered as a DOM element of the type
         * `<svg>` or `<canvas>`, or a CSS selector to such an element.
         * @param hash Optional hash or value to be rendered. If not specified, the `data-jdenticon-hash` or
         * `data-jdenticon-value` attribute will be evaluated.
         * @param config Optional configuration. If specified, this configuration object overrides any global
         * configuration in its entirety. For backward compatibility a padding value in the range [0.0, 0.5) can be
         * specified in place of a configuration object.
         */
        update(elementOrSelector: Element | string, hashOrValue?: any, config?: JdenticonConfig | number): void;

        /**
         * Updates the identicon in the specified `<canvas>` elements.
         * 
         * @remarks
         * This method is only available in the browser. Calling this method on Node.js will throw an error.
         * 
         * @param elementOrSelector Specifies the container in which the icon is rendered as a DOM element of the type
         *    `<canvas>`, or a CSS selector to such an element.
         * @param hashOrValue Optional hash or value to be rendered. If not specified, the `data-jdenticon-hash` or
         *    `data-jdenticon-value` attribute will be evaluated.
         * @param config Optional configuration. If specified, this configuration object overrides any
         *    global configuration in its entirety. For backward compatibility a padding value in the range [0.0, 0.5) can be
         *    specified in place of a configuration object.
         */
        updateCanvas(elementOrSelector: Element | string, hashOrValue?: any, config?: JdenticonConfig | number): void;

        /**
         * Updates the identicon in the specified `<svg>` elements.
         * 
         * @remarks
         * This method is only available in the browser. Calling this method on Node.js will throw an error.
         * 
         * @param elementOrSelector Specifies the container in which the icon is rendered as a DOM element of the type
         *    `<svg>`, or a CSS selector to such an element.
         * @param hashOrValue Optional hash or value to be rendered. If not specified, the `data-jdenticon-hash` or
         *    `data-jdenticon-value` attribute will be evaluated.
         * @param config Optional configuration. If specified, this configuration object overrides any
         *    global configuration in its entirety. For backward compatibility a padding value in the range [0.0, 0.5) can be
         *    specified in place of a configuration object.
         */
        updateSvg(elementOrSelector: Element | string, hashOrValue?: any, config?: JdenticonConfig | number): void;

        /**
         * Draws an identicon to a context.
         * @param ctx Canvas context on which the icon will be drawn at location (0, 0).
         * @param hashOrValue A hexadecimal hash string or any value that will be hashed by Jdenticon.
         * @param size Icon size in pixels.
         * @param config Optional configuration. If specified, this configuration object overrides any global
         * configuration in its entirety. For backward compatibility a padding value in the range [0.0, 0.5) can be
         * specified in place of a configuration object.
         */
        drawIcon(
            ctx: JdenticonCompatibleCanvasRenderingContext2D,
            hashOrValue: any,
            size: number,
            config?: JdenticonConfig | number): void;

        /**
         * Draws an identicon as an SVG string.
         * @param hashOrValue A hexadecimal hash string or any value that will be hashed by Jdenticon.
         * @param size Icon size in pixels.
         * @param config Optional configuration. If specified, this configuration object overrides any global
         * configuration in its entirety. For backward compatibility a padding value in the range [0.0, 0.5) can be
         * specified in place of a configuration object.
         * @returns SVG string
         */
        toSvg(hashOrValue: any, size: number, config?: JdenticonConfig | number): string;

        /**
         * Draws an identicon as PNG.
         * 
         * @remarks
         * This method is not available in the browser.
         * 
         * @param hashOrValue A hexadecimal hash string or any value that will be hashed by Jdenticon.
         * @param size Icon size in pixels.
         * @param config Optional configuration. If specified, this configuration object overrides any global
         * configuration in its entirety. For backward compatibility a padding value in the range [0.0, 0.5) can be
         * specified in place of a configuration object.
         * @returns PNG data
         */
        toPng(hashOrValue: any, size: number, config?: JdenticonConfig | number): Buffer;

        /**
         * Gets the current global style configuration.
         */
        configure(): JdenticonConfig;

        /**
         * Specifies the color options for the generated icons. This is the only supported method of setting identicon
         * styles when used in a Node environment.
         * 
         * In browsers {@link jdenticon_config} is the prefered way of setting an identicon style to avoid a race
         * condition where the style is set before the Jdenticon lib has loaded, leading to an unhandled error.
         */
        configure(newConfig: JdenticonConfig): JdenticonConfig;

        /**
         * Specifies the version of the Jdenticon package in use.
         */
        readonly version: string;
    }

    /**
     * This is a subset of `HTMLCanvasElement` to allow using incomplete canvas implementations, 
     * like `canvas-renderer`.
     */
    interface JdenticonCompatibleCanvas {
        // HTMLCanvasElement
        readonly height: number;
        readonly width: number;
        getContext(contextId: "2d"): JdenticonCompatibleCanvasRenderingContext2D | null;
    }

    /**
     * This is a subset of `CanvasRenderingContext2D` to allow using incomplete canvas implementations, 
     * like `canvas-renderer`.
     */
    interface JdenticonCompatibleCanvasRenderingContext2D {
        // CanvasRenderingContext2D
        readonly canvas: JdenticonCompatibleCanvas;
        
        // CanvasDrawPath
        beginPath(): void;
        fill(): void;
        
        // CanvasFillStrokeStyles
        fillStyle: any;

        // CanvasPath
        arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, anticlockwise?: boolean): void;
        closePath(): void;
        lineTo(x: number, y: number): void;
        moveTo(x: number, y: number): void;
        
        // CanvasRect
        clearRect(x: number, y: number, w: number, h: number): void;
        fillRect(x: number, y: number, w: number, h: number): void;
        
        // CanvasState
        restore(): void;
        save(): void;
        
        // CanvasTransform
        translate(x: number, y: number): void;
    }

    interface JQuery {
        /**
         * Renders an indenticon for all matching supported elements.
         * 
         * @param hashOrValue A hexadecimal hash string or any value that will be hashed by Jdenticon. If not 
         * specified the `data-jdenticon-hash` and `data-jdenticon-value` attributes of each element will be
         * evaluated.
         * @param config Optional configuration. If specified, this configuration object overrides any global
         * configuration in its entirety. For backward compatibility a padding value in the range [0.0, 0.5) can be
         * specified in place of a configuration object.
         */
        jdenticon(hashOrValue?: any, config?: JdenticonConfig | number): void;
    }

    interface Window {
        /**
         * Specifies options for generated identicons.
         * 
         * See also {@link jdenticon.config} for Node usage.
         */
        jdenticon_config?: JdenticonConfig;
    }
}

declare var jdenticon: Jdenticon;
export = jdenticon;
export as namespace jdenticon;

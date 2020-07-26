import { update } from "./update";

/**
 * Renders an identicon for all matching supported elements.
 * 
 * @param {*} hashOrValue - A hexadecimal hash string or any value that will be hashed by Jdenticon. If not 
 * specified the `data-jdenticon-hash` and `data-jdenticon-value` attributes of each element will be
 * evaluated.
 * @param {Object|number=} config - Optional configuration. If specified, this configuration object overrides any global
 * configuration in its entirety. For backward compatibility a padding value in the range [0.0, 0.5) can be
 * specified in place of a configuration object.
 */
export function jdenticonJqueryPlugin(hashOrValue, config) {
    this["each"](function (index, el) {
        update(el, hashOrValue, config);
    });
    return this;
}
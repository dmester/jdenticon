/**
 * Jdenticon
 * https://github.com/dmester/jdenticon
 * Copyright © Daniel Mester Pirttijärvi
 */

import { HASH_ATTRIBUTE, ICON_SELECTOR, VALUE_ATTRIBUTE, getIdenticonType } from "./dom";

export function observer(updateCallback) {
    if (typeof MutationObserver != "undefined") {
        const mutationObserver = new MutationObserver(function onmutation(mutations) {
            for (let mutationIndex = 0; mutationIndex < mutations.length; mutationIndex++) {
                const mutation = mutations[mutationIndex];
                const addedNodes = mutation.addedNodes;
        
                for (let addedNodeIndex = 0; addedNodes && addedNodeIndex < addedNodes.length; addedNodeIndex++) {
                    const addedNode = addedNodes[addedNodeIndex];
        
                    // Skip other types of nodes than element nodes, since they might not support
                    // the querySelectorAll method => runtime error.
                    if (addedNode.nodeType == Node.ELEMENT_NODE) {
                        if (getIdenticonType(addedNode)) {
                            updateCallback(addedNode);
                        }
                        else {
                            const icons = addedNode.querySelectorAll(ICON_SELECTOR);
                            for (let iconIndex = 0; iconIndex < icons.length; iconIndex++) {
                                updateCallback(icons[iconIndex]);
                            }
                        }
                    }
                }
                
                if (mutation.type == "attributes" && getIdenticonType(mutation.target)) {
                    updateCallback(mutation.target);
                }
            }
        });

        mutationObserver.observe(document.body, {
            "childList": true,
            "attributes": true,
            "attributeFilter": [VALUE_ATTRIBUTE, HASH_ATTRIBUTE, "width", "height"],
            "subtree": true,
        });
    }
}

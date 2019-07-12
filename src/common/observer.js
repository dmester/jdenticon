/**
 * Jdenticon
 * https://github.com/dmester/jdenticon
 * Copyright © Daniel Mester Pirttijärvi
 */
"use strict";

const dom = require("./dom");

function observer(updateCallback) {
    if (typeof MutationObserver != "undefined") {
        var mutationObserver = new MutationObserver(function onmutation(mutations) {
            for (var mutationIndex = 0; mutationIndex < mutations.length; mutationIndex++) {
                var mutation = mutations[mutationIndex];
                var addedNodes = mutation.addedNodes;
        
                for (var addedNodeIndex = 0; addedNodes && addedNodeIndex < addedNodes.length; addedNodeIndex++) {
                    var addedNode = addedNodes[addedNodeIndex];
        
                    // Skip other types of nodes than element nodes, since they might not support
                    // the querySelectorAll method => runtime error.
                    if (addedNode.nodeType == Node.ELEMENT_NODE) {
                        if (dom.getIdenticonType(addedNode)) {
                            updateCallback(addedNode);
                        }
                        else {
                            var icons = addedNode.querySelectorAll(dom.ICON_SELECTOR);
                            for (var iconIndex = 0; iconIndex < icons.length; iconIndex++) {
                                updateCallback(icons[iconIndex]);
                            }
                        }
                    }
                }
                
                if (mutation.type == "attributes" && dom.getIdenticonType(mutation.target)) {
                    updateCallback(mutation.target);
                }
            }
        });

        mutationObserver.observe(document.body, { 
            "childList": true, 
            "attributes": true, 
            "attributeFilter": [dom.VALUE_ATTRIBUTE, dom.HASH_ATTRIBUTE, "width", "height"], 
            "subtree": true 
        });
    }
}

module.exports = observer;

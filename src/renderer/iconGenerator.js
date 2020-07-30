/**
 * Jdenticon
 * https://github.com/dmester/jdenticon
 * Copyright © Daniel Mester Pirttijärvi
 */

import { Transform } from "./transform";
import { Graphics } from "./graphics";
import { centerShape, outerShape } from "./shapes";
import { colorTheme } from "./colorTheme";
import { parseHex } from "../common/parseHex";
import { getConfiguration } from "../common/configuration";
     
/**
 * Draws an identicon to a specified renderer.
 */
export function iconGenerator(renderer, hash, config) {
    config = getConfiguration(config, 0.08);

    // Set background color
    if (config.backColor) {
        renderer.setBackground(config.backColor);
    }
    
    // Calculate padding and round to nearest integer
    let size = renderer.iconSize;
    const padding = (0.5 + size * config.iconPadding) | 0;
    size -= padding * 2;
    
    const graphics = new Graphics(renderer);
    
    // Calculate cell size and ensure it is an integer
    const cell = 0 | (size / 4);
    
    // Since the cell size is integer based, the actual icon will be slightly smaller than specified => center icon
    const x = 0 | (padding + size / 2 - cell * 2);
    const y = 0 | (padding + size / 2 - cell * 2);

    function renderShape(colorIndex, shapes, index, rotationIndex, positions) {
        const shapeIndex = parseHex(hash, index, 1);
        let r = rotationIndex ? parseHex(hash, rotationIndex, 1) : 0;
        
        renderer.beginShape(availableColors[selectedColorIndexes[colorIndex]]);
        
        for (let i = 0; i < positions.length; i++) {
            graphics._transform = new Transform(x + positions[i][0] * cell, y + positions[i][1] * cell, cell, r++ % 4);
            shapes(shapeIndex, graphics, cell, i);
        }
        
        renderer.endShape();
    }

    // AVAILABLE COLORS
    const hue = parseHex(hash, -7) / 0xfffffff,
    
          // Available colors for this icon
          availableColors = colorTheme(hue, config),

          // The index of the selected colors
          selectedColorIndexes = [];

    let index;

    function isDuplicate(values) {
        if (values.indexOf(index) >= 0) {
            for (let i = 0; i < values.length; i++) {
                if (selectedColorIndexes.indexOf(values[i]) >= 0) {
                    return true;
                }
            }
        }
    }

    for (let i = 0; i < 3; i++) {
        index = parseHex(hash, 8 + i, 1) % availableColors.length;
        if (isDuplicate([0, 4]) || // Disallow dark gray and dark color combo
            isDuplicate([2, 3])) { // Disallow light gray and light color combo
            index = 1;
        }
        selectedColorIndexes.push(index);
    }

    // ACTUAL RENDERING
    // Sides
    renderShape(0, outerShape, 2, 3, [[1, 0], [2, 0], [2, 3], [1, 3], [0, 1], [3, 1], [3, 2], [0, 2]]);
    // Corners
    renderShape(1, outerShape, 4, 5, [[0, 0], [3, 0], [3, 3], [0, 3]]);
    // Center
    renderShape(2, centerShape, 1, null, [[1, 1], [2, 1], [2, 2], [1, 2]]);
    
    renderer.finish();
}

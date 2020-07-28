const { PNG } = require("pngjs");

async function screenshot(driver) {
    var dimensions = await driver.executeScript(`return { 
        scrollWidth: document.body.offsetWidth, 
        scrollHeight: document.body.offsetHeight, 
        innerWidth: window.innerWidth || document.documentElement.clientWidth,
        innerHeight: window.innerHeight || document.documentElement.clientHeight
    }`);

    const combinedImage = new PNG({
        width: dimensions.scrollWidth,
        height: dimensions.scrollHeight
    });
    
    const xnum = Math.ceil(dimensions.scrollWidth / dimensions.innerWidth);
    const ynum = Math.ceil(dimensions.scrollHeight / dimensions.innerHeight);

    for (let x = 0; x < xnum; x++) {
        for (let y = 0; y < ynum; y++) {
            
            var scrollpos = await driver.executeScript(`
                window.scrollTo(${x * dimensions.innerWidth}, ${y * dimensions.innerHeight});
                return { x: window.scrollX || window.pageXOffset, y: window.scrollY || window.pageYOffset }`)

            const datauri = await driver.takeScreenshot();
            const image = PNG.sync.read(Buffer.from(datauri, "base64"));
            
            PNG.bitblt(image, combinedImage,
                0, 0,
                Math.min(image.width, combinedImage.width - scrollpos.x), 
                Math.min(image.height, combinedImage.height - scrollpos.y),
                scrollpos.x,
                scrollpos.y);

        }
    }

    return PNG.sync.write(combinedImage);
}

module.exports = screenshot;

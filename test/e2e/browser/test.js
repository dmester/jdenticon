const express = require("express");
const fs = require("fs");
const tap = require("tap");
const webdriver = require("selenium-webdriver");
const screenshot = require("./screenshooter");
const BlinkDiff = require("blink-diff");
const path = require("path");

// Command line arguments examples:
//   node test.js win ie11,chrome
//   node test.js macos safari,chrome,firefox

const environmentId = process.argv[2] || "";
const enabledBrowsers = (process.argv[3] || "").split(/[,;]/g).filter(name => name);

if (!enabledBrowsers.length) {
    throw new Error("Expected browser names");
}

const screenshotDir = process.env.BROWSER_SCREENSHOT_DIR || path.join(__dirname, "artifacts/screenshots");
const diffDir = process.env.BROWSER_DIFF_DIR || path.join(__dirname, "artifacts/diffs");
const expectedDir = process.env.BROWSER_EXPECTED_DIR || path.join(__dirname, "expected");

// fs.mkdirSync(_ , { recursive: true }) did not work on GitHub Actions using Node v12.18.2 (Windows and macOS).
// Worked fine locally however. Replacing it with a custom recursive implementation.
// Ignored GitHub issue for tracking any status:
// https://github.com/nodejs/node/issues/27293
function mkdirRecursive(dirPath) {
    if (!fs.existsSync(dirPath)) {
        const parent = path.dirname(dirPath)
        if (parent && parent !== dirPath) {
            mkdirRecursive(parent);
        }
        fs.mkdirSync(dirPath);
    }
}

mkdirRecursive(screenshotDir);
mkdirRecursive(diffDir);

const BROWSER_DEFINITIONS = [
    {
        name: "ie11",
        uaCompatible: "IE=Edge",
        capabilities: {
            "browserName": webdriver.Browser.INTERNET_EXPLORER,
        },
    },
    {
        name: "ie10",
        uaCompatible: "IE=10",
        capabilities: {
            "browserName": webdriver.Browser.INTERNET_EXPLORER,
        },
    },
    {
        name: "ie9",
        uaCompatible: "IE=9",
        capabilities: {
            "browserName": webdriver.Browser.INTERNET_EXPLORER,
        },
    },
    {
        name: "firefox",
        capabilities: {
            "browserName": webdriver.Browser.FIREFOX,
        },
    },
    {
        name: "chrome",
        capabilities: {
            "browserName": webdriver.Browser.CHROME,
        },
    },
    {
        name: "edge",
        capabilities: {
            "browserName": webdriver.Browser.EDGE,
            "ms:edgeChromium": true,
        },
    },
    {
        name: "safari",
        capabilities: {
            "browserName": webdriver.Browser.SAFARI,
        },
    },
]

async function serve(root, options, asyncCallback) {
    const app = express();

    app.use(express.static(root, options));

    await new Promise((resolve, reject) => {
        const listener = app.listen(async () => {
            try {
                await asyncCallback(listener);
                resolve();
    
            } catch (e) {
                reject(e);

            } finally {
                listener.close();
            }
        });
    });
}

async function testBrowser(browserName) {
    const browser = BROWSER_DEFINITIONS.find(x => x.name === browserName);
    await tap.test(browserName, async t => {
        if (!browser) {
            t.fail(`Could not find a browser with the name ${browserName}.`); 
            return;
        }

        await serve(
            path.join(__dirname, "../"), 
            {
                "index": ["index.html"],
                setHeaders: resp => {
                    // Prevent stale files
                    resp.setHeader("Cache-Control", "no-store");

                    if (browser.uaCompatible) {
                        resp.setHeader("X-UA-Compatible", browser.uaCompatible);
                    }
                }
            },
            async listener => {
                const url = "http://localhost:" + listener.address().port + "/browser/assets/";
                
                console.log(`Screenshot in ${browserName}`);
                console.log(url);
                
                const driver = await new webdriver.Builder()
                    .withCapabilities(browser.capabilities)
                    .build();
                
                await driver.manage().window().setRect({ width: 1000, height: 2000 });
                
                const documentInitialised = () => driver.executeScript("return true");

                try {
                    await driver.get(url);
                    await driver.wait(() => documentInitialised(), 10000);
                    await driver.sleep(2500);

                    const screenshotBuffer = await screenshot(driver);
                    fs.writeFileSync(path.join(screenshotDir, `${environmentId}-${browserName}.png`), screenshotBuffer);

                } finally {
                    await driver.quit();
                }

                var diff = new BlinkDiff({
                    imageAPath: path.join(expectedDir, `${environmentId}-${browserName}.png`),
                    imageBPath: path.join(screenshotDir, `${environmentId}-${browserName}.png`),
            
                    thresholdType: BlinkDiff.THRESHOLD_PIXEL,
                    threshold: 1000,
            
                    imageOutputPath: path.join(diffDir, `${environmentId}-${browserName}.png`),

                    // Ignore test metadata area containing browser versions etc.
                    blockOut: [{ x: 0, y: 0, width: 20000, height: 100 }],
                });

                const diffResult = await diff.runWithPromise();
                t.ok(diff.hasPassed(diffResult.code), `Found ${diffResult.differences} differences.`);
            },
        );
    });
}

async function testBrowsers(enabledBrowsers) {
    for (var i = 0; i < enabledBrowsers.length; i++) {
        await testBrowser(enabledBrowsers[i]);
    }
}

testBrowsers(enabledBrowsers);
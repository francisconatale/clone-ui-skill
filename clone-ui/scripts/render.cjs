const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

async function renderScreenshot(htmlPath, outputPath, width = 1200, height = 800) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  const htmlContent = fs.readFileSync(htmlPath, "utf8");
  
  await page.setViewport({ 
    width: parseInt(width), 
    height: parseInt(height), 
    deviceScaleFactor: 2 
  });
  
  await page.setContent(htmlContent);
  await page.evaluateHandle(() => document.fonts.ready);
  
  await page.screenshot({ path: outputPath });
  await browser.close();
}

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error("Usage: node render.cjs <input_html_path> <output_screenshot_path> [width] [height]");
  process.exit(1);
}

const inputHtml = path.resolve(args[0]);
const outputImage = path.resolve(args[1]);
const width = args[2] || 1200;
const height = args[3] || 800;

renderScreenshot(inputHtml, outputImage, width, height).catch(err => {
  console.error(err);
  process.exit(1);
});

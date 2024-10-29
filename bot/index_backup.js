const puppeteer=require('puppeteer-extra');
// Or import puppeteer from 'puppeteer-core';
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const sleep = ms => new Promise(res => setTimeout(res, ms));
puppeteer.use(StealthPlugin());
const runApp=async()=>{
    // Launch the browser and open a new blank page
    // const browser = await puppeteer.launch();
    // use this for brower mode
    const browser = await puppeteer.launch({ 
        headless: false, // Set this to false to see the browser UI
        defaultViewport: null, // Optional: ensures you can see the full page
        args: ['--start-maximized'] // Optional: start the browser maximized
      });
    const page = await browser.newPage();

    // Navigate the page to a URL.
    await page.goto('https://chatgpt.com/');

    // Set screen size.
    await page.setViewport({width: 1080, height: 1024});
    await sendPrompt(page,'give me simple code for snake game');
    await sendPrompt(page,'can you explain the code you provide?');
    // Type into search box.
    // await page.locator('.devsite-search-field').fill('automate beyond recorder');

    // // Wait and click on first result.
    // await page.locator('.devsite-result-item-link').click();

    // // Locate the full title with a unique string.
    // const textSelector = await page
    // .locator('text/Customize and automate')
    // .waitHandle();
    // const fullTitle = await textSelector?.evaluate(el => el.textContent);

    // Print the full title.
    // console.log('The title of this blog post is "%s".', fullTitle);

    // await browser.close();
}
const sendPrompt=async(page,prompt)=>{
    console.log('Question: '+prompt);
    await page.type('textarea',prompt,{delay:250})
    await page.click('button[aria-label="Send prompt"]');
    await sleep(20000);
    const text = await page.evaluate(() => {
        const element = Array.from(document.querySelectorAll('.agent-turn'));
        if(element.length>0){
            return element ? element[element.length-1].innerHTML.trim() : null; // Return the text content or null if not found
        }
        
      });
      
    console.log('Answer:', text);
}
runApp();

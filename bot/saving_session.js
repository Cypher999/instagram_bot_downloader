const puppeteer=require('puppeteer-extra');
// Or import puppeteer from 'puppeteer-core';
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const sleep = ms => new Promise(res => setTimeout(res, ms));
puppeteer.use(StealthPlugin());
require('dotenv').config();
const fs = require('fs');
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
    
    const cookies = await page.cookies();
    fs.writeFileSync('sessions/cookies.json', JSON.stringify(cookies));

    // Save local storage
    const localStorageData = await page.evaluate(() => {
        return JSON.stringify(localStorage);
    });
    fs.writeFileSync('sessions/localStorage.json', localStorageData);
    // await sleep(10000);
    // await browser.close();
}

runApp();

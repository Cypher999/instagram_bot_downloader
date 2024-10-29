const puppeteer=require('puppeteer-extra');
// Or import puppeteer from 'puppeteer-core';
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const sleep = ms => new Promise(res => setTimeout(res, ms));
puppeteer.use(StealthPlugin());
require('dotenv').config();
const fs=require('fs');
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
    const cookiesString = fs.readFileSync('sessions/cookies.json');
    const cookies = JSON.parse(cookiesString);
    await page.setCookie(...cookies);
    // Navigate the page to a URL.
    await page.goto('https://chatgpt.com/');

    // Set screen size.
    await page.setViewport({width: 1080, height: 1024});
    
    sendPrompt(page,'generate image of hacker being surrounded by police and drone');
}
const generateAnswer=async(page)=>{
  const text = await page.evaluate(() => {
    const element = Array.from(document.querySelectorAll('.agent-turn'));
    if(element.length>0){
        return element ? element[element.length-1].innerHTML.trim() : null; // Return the text content or null if not found
    }
    
  });
  console.log(text);
}
const sendPrompt=async(page,prompt)=>{
    console.log('Question: '+prompt);
    await page.type('textarea',prompt,{delay:250})
    await page.click('button[aria-label="Send prompt"]');
    
    let intervalId = setInterval(() => {
        generateAnswer(page); // Call myFunction with parameters
    }, 1000); 
    await page.waitForSelector('button[aria-label="Stop streaming"]', { hidden: true });
    clearInterval(intervalId)
}
runApp();

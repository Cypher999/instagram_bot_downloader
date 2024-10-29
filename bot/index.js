const express = require('express');
const app = express();
//New imports
const http = require('http').Server(app);
const cors = require('cors');
const puppeteer=require('puppeteer-extra');
// Or import puppeteer from 'puppeteer-core';
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const sleep = ms => new Promise(res => setTimeout(res, ms));
const fs=require('fs');
require('dotenv').config();
app.use(cors());
puppeteer.use(StealthPlugin());
const socketIO = require('socket.io')(http, {
  cors: {
    origin: process.env.APP_URL
  }
});
class PuppeteerHandler{
   constructor (socket){
    this.socket=socket;
    this.init()
  }
  async init (){
    //use code below for headless
    // this.browser = await puppeteer.launch();
    this.browser = await puppeteer.launch({ 
      headless: false, 
      defaultViewport: null, 
      args: ['--start-maximized'] 
    });
    this.page = await this.browser.newPage();
    const cookiesString = fs.readFileSync('sessions/cookies.json');
    const cookies = JSON.parse(cookiesString);
    await this.page.setCookie(...cookies);
    await this.page.goto('https://chatgpt.com/');
    await this.page.waitForNavigation({ waitUntil: 'load' });
    this.socket.emit()
  }
  async sendPrompt(prompt){
    await this.page.type('textarea',prompt,{delay:50})
    await this.page.click('button[aria-label="Send prompt"]');
    let makeInterval = setInterval(() => {
        this.generateAnswer(); // Call myFunction with parameters
    }, 100); 
    await this.page.waitForSelector('button[aria-label="Stop streaming"]', { hidden: true });
    clearInterval(makeInterval)    
    this.socket.emit("done")
  }
  async generateAnswer(){
    const text = await this.page.evaluate(() => {
      const element = Array.from(document.querySelectorAll('.agent-turn'));
      const elementChoose=Array.from(document.querySelectorAll('.snap-mandatory'))
      if(element.length>0){
          return element ? element[element.length-1].innerHTML.trim() : null; // Return the text content or null if not found
      }
      else if(elementChoose>0){
        return element ? element[element.length-1].getElementsByClassName('border-token-main-surface-tertiary')[0].innerHTML.trim() : null; // Return the text content or null if not found
      }
      
    });
    this.socket.emit("ack",text)
  }
  async closePage(){
    await this.browser.close();
  }
}

class SocketHandler{
  constructor(socket){
    this.socket=socket
    this.puppeteer=new PuppeteerHandler(socket)
    this.handle()
  }
  async handle(){
    this.socket.on('send',async(data) => {
      if(data){
        await this.puppeteer.sendPrompt(data);
        
      }
    })
    this.socket.on('disconnect', async () => {
      await this.puppeteer.closePage();
      console.log(this.socket.id + " is disconnecting ");
    });
  }
}
socketIO.on('connection', async (socket) => {
  new SocketHandler(socket)
});

http.listen(process.env.PORT,process.env.HOST, () => {
  console.log("server listening on " + process.env.HOST + ":" + process.env.PORT);
});

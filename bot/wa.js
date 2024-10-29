// import makeWASocket, { DisconnectReason,BufferJSON,useMultiFileAuthState } from '@whiskeysockets/baileys'
const baileys=require ('@whiskeysockets/baileys');
const { time } = require('console');
const fs=require('fs')
const puppeteer=require('puppeteer-extra');
// Or import puppeteer from 'puppeteer-core';
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const sleep = ms => new Promise(res => setTimeout(res, ms));
puppeteer.use(StealthPlugin());
const puppeteerObj={}
const path=require('path')
class PuppeteerHandler{
   constructor (socket,target){
    this.socket=socket;
    this.target=target;
    this.link=[];
    this.text="";
    this.answer="";
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
    this.downloadPath = path.resolve(__dirname, 'downloads');
    const client = await this.page.target().createCDPSession();
    await client.send('Page.setDownloadBehavior', {
      behavior: 'allow',
      downloadPath: this.downloadPath,
    });
    const cookiesString = fs.readFileSync('sessions/cookies.json');
    const cookies = JSON.parse(cookiesString);
    await this.page.setCookie(...cookies);
    await this.page.goto('https://savefrom.net/');
    // await this.page.waitForNavigation({ waitUntil: 'load' });
    await this.page.waitForSelector('input[name="sf_url"]', { hidden: false },{ timeout: 150000 });    
  }
  async waitForNewFile (){
    const initialFiles = fs.readdirSync(this.downloadPath);
    return new Promise((resolve, reject) => {
      const interval = setInterval(() => {
        const currentFiles = fs.readdirSync(this.downloadPath);
        const newFiles = currentFiles.filter(file => !initialFiles.includes(file)&& !file.endsWith('.crdownload'));        
        if (newFiles.length > 0) {
          clearInterval(interval);
          resolve(newFiles[0]); // Resolve with the new file name
        }
      }, 100); // Check every 100ms

      // Optional timeout to prevent infinite waiting
     
    });
  };
  async sendFile (filePath, caption = ''){
    const fileType = path.extname(filePath).slice(1); // Get the file extension
    const fileBuffer = fs.readFileSync(filePath);
    
    await this.socket.sendMessage(this.target, {
      document: fileBuffer,
      mimetype: `application/${fileType}`, // Mime type based on file extension
      fileName: path.basename(filePath),
      caption: caption,
    });
    await fs.unlinkSync(filePath)
  };
  async sendLink(target,prompt){
    await this.socket.sendMessage(this.target, { text:"processing"})
    await this.page.waitForSelector('input[name="sf_url"]', { hidden: false },{ timeout: 150000 });    
    await this.page.type('input[name="sf_url"]',prompt,{delay:50})    
    await this.page.click('button[name="sf_submit"]');
    await this.page.waitForSelector('div[class="drop-down-box"]', { hidden: false },{ timeout: 150000 });
    await this.page.click('div[class="drop-down-box"]');
    const linkGroup=await this.page.$$('.link-group')
    
    if(linkGroup){
      const a_element=await linkGroup[0].$("a");
      if (a_element){
        const title = await this.page.evaluate(el => el.getAttribute('title'), a_element);
        const filename = await this.page.evaluate(el => el.getAttribute('download'), a_element);
        await this.page.click('a[title="'+title+'"]');
        await this.socket.sendMessage(this.target, { text:"downloading"})
        console.log(filename)
        let newFile=await this.waitForNewFile()
        console.log('file has been downloaded')
        console.log('name='+newFile)
        await this.socket.sendMessage(this.target, { text:"sending file"})
        await this.sendFile(path.resolve(this.downloadPath,newFile));
      }
      // linkGroup.forEach(async (lg,i_lg)=>{
      //   const a_element=await lg.$$("a");
      //   a_element.forEach(async(ae,i_ae)=>{
      //     const title = await this.page.evaluate(el => el.getAttribute('title'), ae);
      //     const type = await this.page.evaluate(el => el.textContent, ae);
      //     const filename = await this.page.evaluate(el => el.download, ae);
      //     const link = await this.page.evaluate(el => el.getAttribute('href'), ae);
      //     this.link.push({ title,type,filename,link })          
      //     console.log({ title,type,filename,link });
      //     sleep(5000)
      //     await this.socket.sendMessage(this.target, { text:`[${this.link.length}] ${title}`})
      //   })
      //   console.log(this.answer)
      // })
    }
    // await this.page.click('a[title="video format: 360"]');
    
    this.answer="";
  }
  async closePage(){
    await this.browser.close();
  }
}
async function connectToWhatsApp () {
    const { state, saveCreds } = await baileys.useMultiFileAuthState('auth_info_baileys')
    const sock = baileys.makeWASocket({
        // can provide additional config here
        printQRInTerminal: true,
        auth:state,
    })
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        if(connection === 'close') {
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== baileys.DisconnectReason.loggedOut
            console.log('connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect)
            // reconnect if not logged out
            if(shouldReconnect) {
                connectToWhatsApp()
            }
        } else if(connection === 'open') {
            console.log('opened connection')
        }
    })
    sock.ev.on('messages.upsert', async(m) => {
      if(m.messages[0].key.remoteJid){
        try {
          // console.log(JSON.stringify(m, undefined, 2))
          // console.log(m.messages[0].key.remoteJid)
          console.log(m.messages[0]);
          let target=m.messages[0].key.remoteJid;
          let pesan=m.messages[0].message.extendedTextMessage!==null ? m.messages[0].message.extendedTextMessage.text:m.messages[0].message.conversation;
          if(pesan.indexOf('.download_video[')>-1){
              if(Object.keys(puppeteerObj).length<=5){
                let quoted=m.messages[0];
                  let autoClose=setTimeout(async function(){
                      await puppeteerObj[target].closePage();
                      await sock.sendMessage(target, { text: "current session is turned of" },{quoted})
                      
                  },180000);
                  if(target in puppeteerObj===false){
                      puppeteerObj[target]=new PuppeteerHandler(sock,target);
                      await sock.sendMessage(target, { text: "session initialized, welcome "+m.messages[0].pushName },{quoted})
                      await puppeteerObj[target].init()
                  }
                  if(target in puppeteerObj){
                      clearTimeout(autoClose);
                      let promptContent=pesan.split(".download_video[")[1].split("]")[0];                   
                      await puppeteerObj[target].sendLink(target,promptContent);
                      autoClose=setTimeout(async function(){
                          await puppeteerObj[target].closePage();
                          delete puppeteerObj[target]
                          await sock.sendMessage(target, { text: "current session is turned of" },{quoted})
                      },180000);
                  }
              }
              else{
                  await sock.sendMessage(target, { text: 'maaf downloader sudah mencapai limit' },{quoted:m.messages[0]})
                  
              }
              
          }
        } catch (error) {
          console.log(error)
          await sock.sendMessage(m.messages[0].key.remoteJid, { text: 'uncaugh system error, please standby' })
        }
      }
      
        
        
    })
    sock.ev.on ('creds.update', saveCreds)
}
// run in main file
connectToWhatsApp()


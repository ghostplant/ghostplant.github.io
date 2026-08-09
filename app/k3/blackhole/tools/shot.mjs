import puppeteer from 'puppeteer-core';
import { spawn } from 'child_process';
const server = spawn('python3',['-m','http.server','8125'],{cwd:process.cwd(),stdio:'ignore'});
await new Promise(r=>setTimeout(r,800));
const browser = await puppeteer.launch({ executablePath:'/tmp/chrome-headless-shell-linux64/chrome-headless-shell', headless:'shell',
  args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--window-size=800,600'] });
const page = await browser.newPage();
page.on('pageerror', e=>console.log('[PE]', e.message.slice(0,200)));
const q = process.argv[2] || '';
const out = process.argv[3] || 'shot.png';
await page.goto('http://localhost:8125/?shot=1&t=0.5&nohud=1&'+q, { waitUntil:'load', timeout:20000 });
await page.waitForFunction('window.__READY__===true', { timeout: 40000 });
await new Promise(r=>setTimeout(r,300));
await page.screenshot({ path: out });
console.log('OK', out);
await browser.close(); server.kill();

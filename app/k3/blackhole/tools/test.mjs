// Headless test: load page, capture console, wait for ready, screenshot.
import puppeteer from 'puppeteer-core';
import { spawn } from 'child_process';
import fs from 'fs';

const CHROME = '/tmp/chrome-headless-shell-linux64/chrome-headless-shell';
const PORT = 8123;
const url = process.argv[2] || `http://localhost:${PORT}/?shot=1&t=1&nohud=1`;
const outPng = process.argv[3] || 'test_shot.png';

const server = spawn('python3', ['-m', 'http.server', String(PORT)], { cwd: process.cwd(), stdio: 'ignore' });
await new Promise(r => setTimeout(r, 800));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'shell',
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox', '--window-size=1280,720'],
});
const page = await browser.newPage();
await page.setViewport({ width: 800, height: 600 });

const logs = [];
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => logs.push(`[PAGEERROR] ${e.message}`));
page.on('requestfailed', (r) => logs.push(`[REQFAIL] ${r.url()} ${r.failure()?.errorText}`));

try {
  await page.goto(url, { waitUntil: 'load', timeout: 30000 });
  await page.waitForFunction('window.__READY__ === true', { timeout: 60000 });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: outPng });
  console.log('SCREENSHOT_OK', outPng);
} catch (e) {
  console.log('TEST_FAIL:', e.message);
  try { await page.screenshot({ path: 'test_fail.png' }); } catch {}
}

const errors = logs.filter(l => /error|PAGEERROR|REQFAIL/i.test(l) && !/favicon/i.test(l));
console.log('--- console (errors) ---');
errors.forEach(l => console.log(l));
console.log('--- all logs count:', logs.length, 'errors:', errors.length);
await browser.close();
server.kill();
process.exit(errors.length ? 1 : 0);
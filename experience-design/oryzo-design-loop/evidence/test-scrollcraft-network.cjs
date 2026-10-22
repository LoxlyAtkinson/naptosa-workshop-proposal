const { chromium } = require('C:/Users/loxly/node_modules/playwright');
(async () => {
  const out = 'C:/Users/loxly/Desktop/Projects/Loxly - Personal Projects/naptosa-workshop-proposal/experience-design/oryzo-design-loop/evidence';
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--disable-gpu'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference', acceptDownloads: true });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
  await page.screenshot({ path: `${out}/hero-desktop.png` });
  const chapters = await page.locator('.chapter-links a').allTextContents();
  const labelsVisible = await page.locator('.chapter-links a i').evaluateAll(els => els.every(e => getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0));
  const film = page.locator('#network .community-film');
  const clip = film.locator('video[data-sc-scrub]');
  await film.scrollIntoViewIfNeeded();
  await page.waitForFunction(() => { const v = document.querySelector('#network .community-film video'); return v && v.readyState >= 1; }, null, { timeout: 20000 });
  async function at(p) {
    await page.evaluate(async p => {
      document.documentElement.style.scrollBehavior = 'auto';
      const e = document.querySelector('#network .community-film');
      const r = e.getBoundingClientRect(); const top = r.top + scrollY; const h = r.height; const vh = innerHeight;
      const travel = Math.max(h - vh, 1);
      scrollTo(0, top + travel * p);
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    }, p);
    await page.waitForTimeout(1300);
    return clip.evaluate(v => ({ time: v.currentTime, duration: v.duration, readyState: v.readyState, src: v.currentSrc }));
  }
  const forward1 = await at(0.15); await page.screenshot({ path: `${out}/network-film-early.png` });
  const forward2 = await at(0.78); await page.screenshot({ path: `${out}/network-film-late.png` });
  const reverse = await at(0.25); await page.screenshot({ path: `${out}/network-film-reverse.png` });
  const overflow = await page.evaluate(() => ({ viewport: [innerWidth, innerHeight], doc: [document.documentElement.clientWidth, document.documentElement.scrollWidth], network: document.querySelector('#network').scrollWidth > document.querySelector('#network').clientWidth }));
  const chapterStates = [];
  for (let i = 0; i < 10; i++) {
    const a = page.locator('.chapter-links a').nth(i);
    await a.evaluate(e => e.click()); await page.waitForTimeout(180);
    const id = await a.getAttribute('href');
    chapterStates.push({ id, current: await a.getAttribute('aria-current') });
    if (i === 6) await page.screenshot({ path: `${out}/monthly-desktop.png` });
    if (i === 9) await page.screenshot({ path: `${out}/accept-desktop.png` });
  }
  const response = await page.request.get('http://127.0.0.1:4173/downloads/LBTec-NAPTOSA-National-Web-and-Workshop-Proposal.pdf');
  await browser.close();
  const mobileBrowser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const mobileContext = await mobileBrowser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'no-preference' });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
  const mobileFilm = mobilePage.locator('#network .community-film');
  const mobileClip = mobileFilm.locator('video[data-sc-scrub]');
  await mobileFilm.scrollIntoViewIfNeeded();
  await mobilePage.waitForFunction(() => { const v = document.querySelector('#network .community-film video'); return v && v.readyState >= 1; }, null, { timeout: 20000 });
  async function mobileAt(p) {
    await mobilePage.evaluate(async p => {
      document.documentElement.style.scrollBehavior = 'auto';
      const e = document.querySelector('#network .community-film');
      const r = e.getBoundingClientRect(); const top = r.top + scrollY; const travel = Math.max(r.height - innerHeight, 1);
      scrollTo(0, top + travel * p);
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    }, p);
    await mobilePage.waitForTimeout(1300);
    return mobileClip.evaluate(v => ({ time: v.currentTime, duration: v.duration, readyState: v.readyState, src: v.currentSrc }));
  }
  const mobileEarly = await mobileAt(0.15); await mobilePage.screenshot({ path: `${out}/network-film-mobile-early.png` });
  const mobileLate = await mobileAt(0.78); await mobilePage.screenshot({ path: `${out}/network-film-mobile-late.png` });
  const mobileReverse = await mobileAt(0.25); await mobilePage.screenshot({ path: `${out}/network-film-mobile-reverse.png` });
  const mobile = await mobilePage.evaluate(() => ({ viewport: [innerWidth, innerHeight], doc: [document.documentElement.clientWidth, document.documentElement.scrollWidth], filmWidth: document.querySelector('#network .community-film').getBoundingClientRect().width, videoSrc: document.querySelector('#network .community-film video').currentSrc }));
  await mobilePage.screenshot({ path: `${out}/network-film-mobile.png` });
  await mobileContext.close();
  await mobileBrowser.close();
  const narrowBrowser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const narrowWidths = [];
  for (const width of [360, 320]) {
    const narrowContext = await narrowBrowser.newContext({ viewport: { width, height: 640 }, reducedMotion: 'reduce' });
    const narrowPage = await narrowContext.newPage();
    await narrowPage.goto('http://127.0.0.1:4173/#network', { waitUntil: 'domcontentloaded' });
    await narrowPage.waitForTimeout(300);
    const layout = await narrowPage.evaluate(() => ({ viewport: [innerWidth, innerHeight], doc: [document.documentElement.clientWidth, document.documentElement.scrollWidth], network: { client: document.querySelector('#network').clientWidth, scroll: document.querySelector('#network').scrollWidth } }));
    narrowWidths.push(layout);
    await narrowPage.screenshot({ path: `${out}/network-film-${width}.png` });
    await narrowContext.close();
  }
  await narrowBrowser.close();
  const rmBrowser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const rmContext = await rmBrowser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const rmPage = await rmContext.newPage();
  await rmPage.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
  await rmPage.locator('#network .community-film').scrollIntoViewIfNeeded();
  const reducedMotion = await rmPage.locator('#network .community-film video').evaluate(v => ({ display: getComputedStyle(v).display, src: v.currentSrc, posterVisible: getComputedStyle(document.querySelector('#network .community-film .sc-stage__poster')).opacity }));
  await rmPage.screenshot({ path: `${out}/network-film-reduced.png` });
  await rmContext.close();
  await rmBrowser.close();
  const report = { chapters, labelsVisible, forward1, forward2, reverse, overflow, chapterStates, pdfStatus: response.status(), mobile, mobileScrub: { early: mobileEarly, late: mobileLate, reverse: mobileReverse }, narrowWidths, reducedMotion, errors };
  require('fs').writeFileSync(`${out}/browser-test.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
})().catch(e => { console.error(e); process.exit(1); });

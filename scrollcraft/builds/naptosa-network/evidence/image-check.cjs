const {chromium}=require('playwright-core');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const out={route:'http://localhost:4500/',checkedAt:new Date().toISOString(),viewports:{},errors:[]};
 for(const vp of [{width:1440,height:900,name:'desktop'},{width:390,height:844,name:'mobile'}]){
  const page=await browser.newPage({viewport:{width:vp.width,height:vp.height}});page.on('pageerror',e=>out.errors.push(e.message));await page.goto(out.route,{waitUntil:'networkidle'});
  const imgs=page.locator('.photo-story img');const info=[];
  for(let n=0;n<await imgs.count();n++){const el=imgs.nth(n);await el.scrollIntoViewIfNeeded();await el.evaluate(el=>el.decode());info.push(await el.evaluate(img=>({src:img.getAttribute('src'),alt:img.alt,complete:img.complete,naturalWidth:img.naturalWidth,rect:{width:Math.round(img.getBoundingClientRect().width),height:Math.round(img.getBoundingClientRect().height)},parallax:!!img.closest('[data-sc-parallax]')})));}
  const dims=await page.evaluate(()=>({width:innerWidth,documentWidth:document.documentElement.scrollWidth}));const first=imgs.first();await first.scrollIntoViewIfNeeded();await page.waitForTimeout(200);const t1=await first.evaluate(el=>getComputedStyle(el.closest('[data-sc-parallax]')).transform);await page.evaluate(()=>scrollBy(0,220));await page.waitForTimeout(250);const t2=await first.evaluate(el=>getComputedStyle(el.closest('[data-sc-parallax]')).transform);out.viewports[vp.name]={...dims,images:info,firstImageTransform:{before:t1,after:t2,changed:t1!==t2}};await page.close();
 }
 const rm=await browser.newPage({viewport:{width:390,height:844}});await rm.emulateMedia({reducedMotion:'reduce'});await rm.goto(out.route,{waitUntil:'networkidle'});const reduced=[];for(let n=0;n<await rm.locator('.photo-story img').count();n++){const el=rm.locator('.photo-story img').nth(n);await el.scrollIntoViewIfNeeded();await el.evaluate(el=>el.decode());reduced.push(await el.evaluate(img=>({src:img.getAttribute('src'),loaded:img.complete&&img.naturalWidth>0,transform:getComputedStyle(img).transform,transition:getComputedStyle(img).transitionDuration})));}out.reducedMotion=reduced;
 out.pass=Object.values(out.viewports).every(v=>v.documentWidth<=v.width&&v.images.length===3&&v.images.every(i=>i.complete&&i.naturalWidth>0&&i.alt.length>8)&&v.firstImageTransform.changed)&&out.reducedMotion.length===3&&out.reducedMotion.every(i=>i.loaded&&i.transform==='none')&&!out.errors.length;
 console.log(JSON.stringify(out,null,2));await browser.close();if(!out.pass)process.exit(1);
})();

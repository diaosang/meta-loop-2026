const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url'),os=require('node:os');
const root=path.resolve(__dirname,'..'),entry=pathToFileURL(path.join(root,'试玩_v13_6.html')).href;
const helper=fs.readFileSync(path.join(__dirname,'test_palace_life_v13.cjs'),'utf8').split('let game=boot(),checks=[];')[0],boot=new Function('require','__dirname',helper+';return boot;')(require,__dirname);
const captures=process.env.FENGQUE_TEST_OUTPUT||path.join(os.tmpdir(),'fengque-v13-6-stories');fs.mkdirSync(captures,{recursive:true});
function fixture(arc){const g=boot(fs.readFileSync(path.join(__dirname,'测试夹具/V13争宠合成存档.json'),'utf8'));g.run(`state.introSeen=true;state.tab='people';const p=PEOPLE.find(p=>p.id==='song'),r=state.relations.song;r.aff=75;r.trust=70;r.mind.turns=[];delete r.mind.privateTalk;r.mind.social={count:12,days:[mindTick()-3,mindTick()-2,mindTick()-1,mindTick()],byDay:{},applied:[]};Object.assign(storyOf(p),{arc:'${arc}',patron:${arc==='agent'?"'n001'":'null'},known:{},status:'unopened',decision:null,investigation:null});save();`);return g.save();}
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.FENGQUE_BROWSER||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'}),checks=[],errors=[],samples={};

 try{
  for(const arc of ['blocked','agent']){
   const c=await browser.newContext({viewport:{width:390,height:844}});await c.addInitScript(v=>{if(!localStorage.getItem('fengque-demo-v4'))localStorage.setItem('fengque-demo-v4',v)},fixture(arc));
   const p=await c.newPage();p.on('pageerror',e=>errors.push(String(e)));await p.goto(entry);
   await p.locator('.nav [data-id="notes"]').click();await p.locator('[data-action="notebookTab"][data-id="stories"]').click();assert(!(await p.locator('.notebook-content').innerText()).includes('再将名字递出去'));
   checks.push(arc+'：未听过的隐情不因打开记事自动揭露');
   await p.locator('.nav [data-id="people"]').click();await p.locator('[data-action="visit"][data-id="song"]').first().click();await p.locator('#modal [data-action="interactionCategory"][data-id="chat"]').click();
   for(const facet of ['origin','scar','truth']){await p.locator('#modal [data-action="interactionTopic"][data-id="story:'+facet+'"]').click();samples[arc+'-'+facet]=await p.locator('.scene-text').innerText();assert(!samples[arc+'-'+facet].includes('你说'));}
   assert(samples[arc+'-truth'].includes(arc==='agent'?'沈观澜':'读过什么'));checks.push(arc+'：连续三次对白按已知来路、旧伤和隐情推进');
   await p.screenshot({path:path.join(captures,'v13-6-'+arc+'-truth.png')});assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   await p.locator('#closeModal').click();await p.locator('[data-action="visit"][data-id="song"]').first().click();await p.locator('#modal [data-action="interactionCategory"][data-id="chat"]').click();
   const choice=arc==='agent'?'verify':'test';await p.locator('#modal [data-action="interactionTopic"][data-id="story:choice:'+choice+'"]').click();
   let saved=await p.evaluate(()=>JSON.parse(localStorage.getItem('fengque-demo-v4')));assert.equal(saved.stories.people.song.status,'pending');checks.push(arc+'：决定只登记待办，没有立即成功或授官');
   await p.locator('#closeModal').click();await p.locator('.nav [data-id="home"]').click();await p.locator('[data-action="nextDay"]').click();await p.locator('[data-action="nextDay"]').click();
   saved=await p.evaluate(()=>JSON.parse(localStorage.getItem('fengque-demo-v4')));assert.equal(saved.stories.people.song.status,'resolved');samples[arc+'-result']=saved.stories.people.song.result;
   assert(samples[arc+'-result'].includes(arc==='agent'?'仍须另核':'未直接授官'));checks.push(arc+'：两日后才回报，结果保留考校/核证边界');
   await p.locator('.nav [data-id="notes"]').click();await p.locator('[data-action="notebookTab"][data-id="stories"]').click();await p.locator('[data-action="storyDossier"][data-id="song"]').click();
   assert((await p.locator('.story-dossier').innerText()).includes(samples[arc+'-result']));await p.screenshot({path:path.join(captures,'v13-6-'+arc+'-dossier.png')});checks.push(arc+'：已知身世与后续收在记事，手机可读');
   await p.locator('#closeModal').click();await p.reload();saved=await p.evaluate(()=>JSON.parse(localStorage.getItem('fengque-demo-v4')));assert.equal(saved.stories.people.song.decision,choice);assert.equal(saved.stories.people.song.status,'resolved');checks.push(arc+'：浏览器刷新保留同一身世与已作决定');
   await c.close();
  }
  assert.deepEqual(errors,[]);const report={version:'13.6',passed:checks.length,checks,pageErrors:errors,samples,fixtureNote:'两个故事分支以隔离合成存档验证；不替换游戏兼容旧档。'};
  fs.writeFileSync(path.join(root,'验证报告_v13_6_身世浏览器.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1});

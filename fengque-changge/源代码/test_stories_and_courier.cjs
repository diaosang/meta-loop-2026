const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),helper=fs.readFileSync(path.join(__dirname,'test_palace_life_v13.cjs'),'utf8').split('let game=boot(),checks=[];')[0];
const boot=new Function('require','__dirname',helper+';return boot;')(require,__dirname);
let game=boot(),checks=[];const run=s=>game.run(s),reset=()=>game=boot();
function check(n,f){f();checks.push(n);console.log('PASS '+n);}
function established(id){run(`Object.assign(state.relations['${id}'],{aff:75,trust:70});Object.assign(state.relations['${id}'].mind,{security:65,anger:0,hurt:0,distance:0,disappointment:0,jealousy:0,social:{count:12,days:[mindTick()-3,mindTick()-2,mindTick()-1,mindTick()],byDay:{},applied:[]}});`);}
function meet(id){run(`state.ap=15;visit('${id}');session.section='chat';`);}
function findArc(arc){return run(`PEOPLE.find(p=>storyOf(p).arc==='${arc}'&&!STORY_DATA.core[p.id])?.id`);}
function forceArc(id,arc){run(`Object.assign(storyOf('${id}'),{arc:'${arc}',known:{},status:'unopened',decision:null,due:null,investigation:null});`);}
function reveal(id){established(id);meet(id);run(`interactionTopic('story:origin');interactionTopic('story:scar');interactionTopic('story:truth');`);}
check('100 people receive stable family-conditioned stories',()=>{
 assert.equal(run('Object.keys(state.stories.people).length'),100);assert(run('new Set(Object.values(state.stories.people).map(s=>s.arc)).size>=6'));
 assert(run(`PEOPLE.every(p=>storyOf(p).family===castProfile(p.id).household)`));
});
check('surname and faction do not rewrite genealogical parent links',()=>{
 assert(run(`PEOPLE.every(p=>JSON.stringify(storyRoot().families[storyOf(p).family].parents)===JSON.stringify(castProfile(p.id).parents))`));
 assert.notEqual(run(`storyOf('xu').family`),run(`storyOf('n001').family`));
});
check('canonical core identities and Song musical household remain coherent',()=>{
 assert.equal(run(`storyOf('xu').origin`),'gentry');assert.equal(run(`storyOf('xie').origin`),'fallen');assert.equal(run(`storyOf('song').origin`),'artisan');
 assert(run(`storyPublic(PEOPLE[0]).includes('幼时')`));assert(!run(`storyPublic(PEOPLE[0]).includes('荐书不入门')`));
 assert(run(`storyText(PEOPLE[0],'origin').includes('许氏少主')`));
});
check('public dossiers do not reveal handler orders or unrevealed wounds',()=>{
 const id=findArc('agent');assert(id);const text=run(`storyPanel(PEOPLE.find(p=>p.id==='${id}'))`);
 assert(!text.includes('再将名字递出去'));assert(!text.includes('私人请求'));assert(!text.includes('替我引见的是'));
});
check('secret handlers are actual different officials',()=>{
 assert(run(`Object.values(state.stories.people).filter(s=>s.arc==='agent').every(s=>s.patron!==s.npc&&PEOPLE.find(p=>p.id===s.patron)?.official)`));
});
check('reading and reloading never reroll a stored life',()=>{
 const before=run('JSON.stringify(state.stories)');run(`render();render();save();`);assert.equal(run('JSON.stringify(state.stories)'),before);
 game=boot(game.save());assert.equal(run('JSON.stringify(state.stories)'),before);
});
check('another save seed can change secondary stories without changing genealogy',()=>{
 const saved=JSON.parse(game.save()),a=JSON.stringify(saved.stories.people);saved.stories={version:'13.6',seed:982451653,families:{},people:{},days:{}};
 game=boot(JSON.stringify(saved));assert.notEqual(run('JSON.stringify(state.stories.people)'),a);assert.equal(run('PEOPLE.length'),100);
});
check('a high-affinity stranger cannot skip directly to a secret',()=>{
 reset();meet('song');run(`Object.assign(state.relations.song,{aff:99,trust:99});interactionTopic('story:truth');`);assert(!run(`storyOf('song').known.truth`));assert.equal(run('session.left'),3);
 run(`interactionTopic('story:origin');`);assert(run(`storyOf('song').known.origin`));assert.equal(run('session.left'),2);assert(!run(`session.response.includes('再将名字递出去')`));
});
check('home chat and familiar care share the same background and two matching follow-ups',()=>{
 reset();established('song');meet('song');run(`interactionTopic('home');`);assert(run(`storyOf('song').known.origin`));
 run(`session.section='care';interactionTopic('listen');`);assert.equal(run('state.relations.song.mind.lastTurn.storyMark'),'scar');
 assert.equal(run('state.relations.song.mind.privateTalk.branches.length'),2);
 assert.equal(run('state.relations.song.mind.privateTalk.opening.reply'),run(`storyText(PEOPLE.find(p=>p.id==='song'),'scar')`));
});
check('blocked musician seeks recognition without automatically receiving office',()=>{
 reset();forceArc('song','blocked');reveal('song');assert(run(`session.response.includes('读过什么')`));meet('song');
 run(`interactionTopic('story:choice:test');`);assert.equal(run(`storyOf('song').status`),'pending');assert.equal(run('session.left'),2);assert(!run(`PEOPLE.find(p=>p.id==='song').official`));
 run(`state.day+=2;buildDay();`);assert.equal(run(`storyOf('song').status`),'resolved');assert(run(`storyOf('song').result.includes('未直接授官')`));
});
check('settled choices cannot farm trust, turns or a second result',()=>{
 const before=run(`JSON.stringify({s:storyOf('song'),trust:state.relations.song.trust,left:session.left})`);
 run(`interactionTopic('story:choice:test');buildDay();buildDay();`);assert.equal(run(`JSON.stringify({s:storyOf('song'),trust:state.relations.song.trust,left:session.left})`),before);
});
check('fair assessment can fail despite high affection',()=>{
 reset();const id='n001';forceArc(id,'office');reveal(id);meet(id);run(`for(const k of Object.keys(state.relations['${id}'].skills))state.relations['${id}'].skills[k]=10;castProfile('${id}').specialtyLevel=1;interactionTopic('story:choice:test');state.day+=2;buildDay();`);
 assert.equal(run(`storyOf('${id}').passed`),false);assert(run(`storyOf('${id}').result.includes('仍有不足')`));
});
check('agent confession names a real handler and waits for corroboration',()=>{
 reset();const id=findArc('agent');reveal(id);const patron=run(`PEOPLE.find(p=>p.id===storyOf('${id}').patron).name`);
 assert(run(`session.response.includes(${JSON.stringify(patron)})`));meet(id);run(`interactionTopic('story:choice:verify');`);
 assert.equal(run(`storyOf('${id}').status`),'pending');assert(!run(`storyOf('${id}').investigation?.done`));
 run(`state.day+=2;buildDay();`);assert(run(`storyOf('${id}').investigation.done`));assert(run(`storyOf('${id}').result.includes('仍须另核')`));
 assert(run(`importantNotices().some(n=>n.id.startsWith('story-check:${id}'))`));
});
check('checking volunteered objects costs one action and two days, once only',()=>{
 reset();const id=findArc('agent');established(id);meet(id);run(`interactionTopic('story:origin');interactionTopic('story:scar');`);
 const ap=run('state.ap');run(`actions.storyInvestigate('${id}');`);assert.equal(run('state.ap'),ap-1);assert.equal(run(`storyOf('${id}').investigation.done`),false);
 run(`actions.storyInvestigate('${id}');`);assert.equal(run('state.ap'),ap-1);run(`state.day+=2;buildDay();`);assert.equal(run(`storyOf('${id}').investigation.done`),true);
});
check('listening alone makes no empty career promise',()=>{
 reset();forceArc('song','blocked');reveal('song');meet('song');run(`interactionTopic('story:choice:listen');`);
 assert.equal(run(`storyOf('song').status`),'resolved');assert.equal(run(`storyOf('song').due`),null);assert(!run(`PEOPLE.find(p=>p.id==='song').official`));
});
check('generated candidates retain their exact identity, age and story on reload',()=>{
 reset();run(`window.candidate=makeCastCandidate(17);ensureMinds();ensureInteractionStats();storyOf(window.candidate);save();`);
 const id=run('window.candidate.id'),name=run('window.candidate.name'),story=run(`JSON.stringify(storyOf('${id}'))`),age=run('castAge(window.candidate)');
 game=boot(game.save());assert.equal(run(`PEOPLE.find(p=>p.id==='${id}').name`),name);assert.equal(run(`JSON.stringify(storyOf('${id}'))`),story);assert.equal(run(`castAge(PEOPLE.find(p=>p.id==='${id}'))`),age);
});
check('low-affinity people and high-affinity strangers cannot invite',()=>{
 reset();assert.equal(run(`storyInvitationEligible(PEOPLE.find(p=>p.id==='song'))`),false);
 run(`Object.assign(state.relations.song,{aff:99,trust:99});`);assert.equal(run(`storyInvitationEligible(PEOPLE.find(p=>p.id==='song'))`),false);
 const n=run('state.ecology.inbox.length');run(`for(let i=0;i<30;i++)addMindMessage(PEOPLE.find(p=>p.id==='song'),'invite');`);assert.equal(run('state.ecology.inbox.length'),n);
});
check('eligible invitations have success and failure days, with no render rerolls',()=>{
 established('song');const outcome=run(`(()=>{const p=PEOPLE.find(p=>p.id==='song'),date=state.day,out=[];for(let i=0;i<100;i++){state.day=date+i;out.push(storyInvitationRoll(p));}state.day=date;return out;})()`);
 assert(outcome.some(Boolean));assert(outcome.some(x=>!x));const same=run(`storyInvitationRoll(PEOPLE.find(p=>p.id==='song'))`);run('render();render();');assert.equal(run(`storyInvitationRoll(PEOPLE.find(p=>p.id==='song'))`),same);
});
check('shared daily limit and seven-day per-person cooldown apply',()=>{
 run(`storyInvitationSent(PEOPLE.find(p=>p.id==='song'));`);assert.equal(run(`storyInvitationRoll(PEOPLE.find(p=>p.id==='song'))`),false);
 run(`courierState().sentDays[mindTick()]=2;`);established('lu');assert.equal(run(`storyInvitationRoll(PEOPLE.find(p=>p.id==='lu'))`),false);
});
check('Xie reports actual important cases, never generic chatter',()=>{
 reset();run(`state.case.judgment=null;state.logs.push({month:state.elapsed,type:'相处',text:'随便聊了两句。'});`);
 const notices=run('importantNotices()');assert(notices.some(n=>n.title.includes('少粮')),run('JSON.stringify(state.case)'));assert(notices.every(n=>!n.text.includes('随便聊了两句')));
 assert(notices.every(n=>!n.title.includes('东市伤人')&&!n.title.includes('校尉获盗')));
 run(`state.case.judgment='已结';state.strife.threat=0;state.courtVoice.reports=[];state.ecology.inbox=[];state.frontCourt.affairs=[];state.frontCourt.returns=[];`);assert.equal(run('importantNotices().length'),0);
});
check('notebook presents movements without advancing days or NPC simulation',()=>{
 reset();const before=run(`JSON.stringify({tick:mindTick(),ap:state.ap,n:state.agency.moments.length,stories:state.stories})`);
 run(`state.notebookTab='movements';window.book=notebookHtml();`);assert(run(`window.book.includes('人物动向')&&window.book.includes('看此人的记事')`));
 assert.equal(run(`JSON.stringify({tick:mindTick(),ap:state.ap,n:state.agency.moments.length,stories:state.stories})`),before);
});
check('legacy unearned invites archive harmlessly while accepted appointments survive',()=>{
 const saved=JSON.parse(game.save());saved.correspondence.migrated=false;saved.ecology.inbox.push({id:'old-unearned',npc:'song',kind:'invite',done:false});
 saved.palaceLife.episodes.push({id:'scheduled-kept',npc:'song',kind:'invite',phase:'scheduled',due:999,plan:1});game=boot(JSON.stringify(saved));
 assert(run(`state.ecology.inbox.find(m=>m.id==='old-unearned').done`));assert.equal(run(`state.palaceLife.episodes.find(e=>e.id==='scheduled-kept').phase`),'scheduled');
});
const report={version:'13.6',checks,passed:checks.length,familyOrigins:7,storyArcs:8,protectedCoreBiographies:4};
fs.writeFileSync(path.join(root,'验证报告_v13_6_身世与消息.json'),JSON.stringify(report,null,2));console.log('ALL '+checks.length+' STORY / COURIER CHECKS PASSED');

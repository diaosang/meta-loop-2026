from pathlib import Path
from zipfile import ZipFile
from xml.etree import ElementTree as etree
import json,hashlib

ROOT=Path(__file__).resolve().parent.parent
SOURCE=Path(__file__).resolve().parent
out=ROOT/'网页Demo/index.html'
book=ROOT/'人物内容库_新编/凤阙长歌_万条对话事件与NPC自主行为.xlsx'
ns={'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
with ZipFile(book) as z:
 shared=[]
 if 'xl/sharedStrings.xml' in z.namelist():
  shared=[''.join(x.itertext()) for x in etree.fromstring(z.read('xl/sharedStrings.xml')).findall('m:si',ns)]
 root=etree.fromstring(z.read('xl/worksheets/sheet2.xml'))
 headers=None;rows=[]
 def col(s):
  n=0
  for c in s:
   if c.isdigit():break
   n=n*26+ord(c)-64
  return n-1
 for row in root.findall('m:sheetData/m:row',ns):
  rn=int(row.get('r'))
  if rn<4:continue
  cells={}
  for c in row.findall('m:c',ns):
   typ=c.get('t');v=c.find('m:v',ns)
   if typ=='s':val=shared[int(v.text)]
   elif typ=='inlineStr':val=''.join(c.find('m:is',ns).itertext())
   else:val=v.text if v is not None else ''
   cells[col(c.get('r'))]=val
  vals=[cells.get(i,'') for i in range(25)]
  if rn==4:headers=vals
  else:rows.append(dict(zip(headers,vals)))
# Reconstruct the documented field order from the actual delivered workbook.
# The delivered workbook has evolved from the early 3,600-row template to the
# current 11,520-row authored library.  Read its stable column positions so a
# renamed Chinese header cannot silently drop the dialogue pool.
if len(rows) >= 1 and len(rows[0]) >= 11:
    dialogue=[[r.get('对白ID',r.get('对话ID','')),r.get('性格',''),r.get('当前状态',r.get('状态','')),r.get('类别',''),r.get('动作',''),r.get('地点',''),r.get('触发场景',''),r.get('完整前置',''),r.get('玩家选择',''),r.get('表情动作',''),r.get('NPC回答','')] for r in rows]
else:
    fields=['对白ID','性格','状态','类别','动作','地点','触发场景','完整前置','玩家选择','表情动作','NPC回答']
    dialogue=[[r.get(k,'') for k in fields] for r in rows]
style=out.read_text(encoding='utf-8').split('<body>')[0]
if '<!-- DEMO-EXTRA -->' in style:style=style.split('<!-- DEMO-EXTRA -->')[0]
style=style.replace('</head>','')
import re
style=re.sub(r'<title>.*?</title>', '<title>凤阙长歌 · V16 宫墙内外</title>', style, flags=re.S)
extra='''<!-- DEMO-EXTRA -->
<style>
body{padding-bottom:0}.app{padding-bottom:90px}.page{display:block;padding-top:20px}.nav{gap:4px}.nav button{font-family:inherit}.top{position:relative}.top .brand h1{margin-bottom:7px}.top .status{max-width:290px}.hero{position:relative;overflow:hidden;background:#f3e6e3;border-radius:20px;min-height:238px;border:1px solid #e9d6cf}.hero-copy{position:relative;z-index:1;padding:28px 24px;width:65%}.hero h2{font-size:26px;margin:12px 0}.hero p{font-size:14px;color:#7e5f69;line-height:1.9}.hero-stamp{font-size:11px;border:1px solid #c9a196;padding:5px 9px;border-radius:6px;color:#936055}.hero svg{position:absolute;width:52%;height:100%;right:0;bottom:-10px;opacity:.8}.section-heading{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:12px}.section-heading h3{margin:0;font-size:17px}.section-space{margin-top:20px}.home-event{margin-top:15px}.home-event h3{margin-top:10px}.record+.record{margin-top:9px}.record p{margin:5px 0!important}.person-card{display:flex;border:1px solid var(--line);border-radius:17px;background:#fff;overflow:hidden;min-height:210px}.portrait{width:90px;min-width:90px;position:relative;overflow:hidden;background:linear-gradient(155deg,color-mix(in srgb,var(--person) 22%,#fff9f2),color-mix(in srgb,var(--person) 45%,#fcf1ed));align-self:stretch}.portrait-moon{position:absolute;top:22px;left:18px;width:55px;height:55px;border-radius:50%;background:#fff8e6;opacity:.65}.portrait-head{position:absolute;width:26px;height:32px;border-radius:48% 48% 42% 42%;background:#f1d8ca;top:66px;left:34px;box-shadow:-3px -7px 0 3px #4b3b43}.portrait-robe{position:absolute;width:110px;height:160px;background:var(--person);border-radius:48% 48% 0 0;top:101px;left:-6px;transform:rotate(-8deg)}.portrait b{position:absolute;bottom:15px;left:15px;writing-mode:vertical-rl;color:#fff9f2;letter-spacing:5px;font-size:16px;text-shadow:0 2px 7px #30253466}.portrait.large{min-height:115px;width:74px;min-width:74px;border-radius:12px}.portrait.large .portrait-head{top:26px;left:27px}.portrait.large .portrait-robe{top:63px}.portrait.large b{font-size:13px;bottom:8px;left:8px}.person-body{padding:15px;flex:1;min-width:0}.person-body p{font-size:12px;line-height:1.8;color:#887b80;min-height:43px;margin:8px 0}.person-top{display:flex;justify-content:space-between;align-items:baseline;gap:8px}.person-top h3{font-size:17px;margin:0 0 8px}.person-top small{color:#a49298}.rel-mini{font-size:11px;display:flex;flex-wrap:wrap;gap:9px;color:#9a828c}.rel-mini b{font-family:Georgia,serif;color:#7f485a;font-size:13px}.actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:13px}.talk-banner{display:flex;gap:18px;align-items:center;margin:20px 0}.talk-banner p{font-size:12px;color:#8e737e}.talk-banner small{color:#7e616c}.scene-text{padding:19px 17px;background:#f7eeea;border-radius:13px;line-height:2;font-size:15px;margin:15px 0;color:#4b3641;white-space:normal}.opt small{display:block;margin-top:6px;color:#947e86;line-height:1.6;font-size:11px}.opt:disabled{opacity:.45;cursor:not-allowed}.effect{font-size:12px;line-height:1.8;color:#9d6e4b;padding:0 3px}.text-btn{background:transparent;padding:12px 0;color:#a45a70;font-size:12px}.final-option{background:#f4e7e8}.wide{width:100%;margin-top:12px;padding:12px}.empty{text-align:center;padding:35px 18px;border:1px dashed #ddc5bf;border-radius:17px;color:#9b858b;background:#fff8f3}.empty>span{font-size:44px;color:#caa6a4}.empty h3{font-size:17px;color:#886875}.empty p{font-size:13px;line-height:1.9}.empty.small{padding:12px}.bottom-bar{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:min(100%,1120px);padding:13px 25px calc(13px + env(safe-area-inset-bottom));display:flex;align-items:center;justify-content:space-between;gap:18px;background:#fffcf8ed;backdrop-filter:blur(12px);border-top:1px solid var(--line);z-index:8}.bottom-bar p{font-size:12px;line-height:1.5;color:#937b82;margin:0}.bottom-bar strong{color:#795461}.bottom-bar .btn{white-space:nowrap;padding:12px 22px}.intro-steps p{line-height:1.9;font-size:13px;color:#8e7b83}.intro-steps b{color:#694553}.toast{bottom:90px;border-radius:13px;max-width:90%;width:max-content}.sheet{border:1px solid #ddc3bd}.mini{line-height:1.8}.btn:focus-visible,.opt:focus-visible,.nav button:focus-visible{outline:2px solid #be8d50;outline-offset:3px}
@media(min-width:750px){.modal{align-items:center;padding:25px}.sheet{border-radius:20px;max-height:90vh}.grid{grid-template-columns:1.15fr 1fr}.characters{grid-template-columns:repeat(2,minmax(0,1fr))}.top{padding:27px 30px}}
@media(max-width:720px){.hero{min-height:221px}.hero-copy{width:100%;padding:22px 20px}.hero-copy h2{font-size:23px;max-width:235px;line-height:1.5}.hero svg{width:75%;right:-35px;opacity:.32}.hero p{position:relative;z-index:1}.stats{grid-template-columns:repeat(4,1fr)}.stat{padding:11px 4px}.stat b{font-size:19px}.status{font-size:11px}.top{gap:9px}.brand h1{font-size:23px;letter-spacing:3px}.brand small{font-size:10px;letter-spacing:2px}.top .status{max-width:150px;gap:5px}.pill{font-size:10px;padding:6px 8px}.page h2{line-height:1.5;font-size:22px}.person-body{padding:13px}.characters{gap:12px}.bottom-bar{padding-left:16px;padding-right:16px}.bottom-bar p{font-size:10px}.portrait{width:83px;min-width:83px}.person-card{min-height:207px}.card{border-radius:15px}.section-heading{align-items:flex-start}.section-heading .mini{font-size:10px}.sheet{padding:20px 16px 25px}.scene-text{font-size:14px}.hero .eyebrow{font-size:10px}.nav{padding:8px 10px}}
</style></head>
'''
body='''<body><main class="app">
<header class="top"><div class="brand"><small>大梁 · 宫墙内外 · V16</small><h1>凤阙长歌</h1><p>宫墙内外，皆有故事。</p></div><div class="status"><span class="pill" id="date"></span><span class="pill">行动 <b id="ap">15</b>/15</span><span class="pill">内库 <b id="money">120</b></span><span class="pill">女帝 <b id="rulerAge">19</b>岁</span></div></header>
<nav class="nav" aria-label="游戏页面"><button data-action="tab" data-id="home" data-page="home">宫门</button><button data-action="tab" data-id="people" data-page="people">人物</button><button data-action="tab" data-id="palace" data-page="palace">内廷</button><button data-action="tab" data-id="court" data-page="court">朝堂</button><button data-action="simHome" data-id="realm" data-page="realm">经营</button><button data-action="tab" data-id="notes" data-page="notes">家史</button></nav>
<section id="screen" class="page" aria-label="游戏内容"></section>
</main><footer class="bottom-bar"><p><strong>一月十五点，各有取舍</strong><br><span id="saveStatus" role="status">本地自动存档</span></p><button id="monthButton" class="btn primary" data-action="month">结束本月</button></footer>
<div id="modal" class="modal" aria-hidden="true"><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="modalTitle"><div class="sheet-head"><div><div class="eyebrow" id="modalEyebrow"></div><h2 id="modalTitle" style="margin-bottom:5px"></h2><p id="modalIntro" class="lead" style="margin:0"></p></div><button id="closeModal" class="close" data-action="close" aria-label="关闭对话">×</button></div><div id="modalBody"></div></div></div><div id="toast" class="toast" role="status"></div>
'''
js=(SOURCE/'demo-game.js').read_text(encoding='utf-8')
world=json.loads((SOURCE/'world-data.json').read_text(encoding='utf-8'))
payload=json.dumps({'dialogue':dialogue},ensure_ascii=False,separators=(',',':')).replace('</','<\\\\/')
ext='\nconst EVERYDAY_TALK_DATA='+json.dumps(json.loads((SOURCE/'everyday-talk-data.json').read_text(encoding='utf-8')),ensure_ascii=False,separators=(',',':')).replace('</','<\\/')+';\n'
ext+='\nconst DALIANG_DATA='+json.dumps(json.loads((SOURCE/'daliang-canon-data.json').read_text(encoding='utf-8')),ensure_ascii=False,separators=(',',':')).replace('</','<\\/')+';\n'
ext+= (SOURCE/'demo-world.js').read_text(encoding='utf-8')
ext += '\n' + (SOURCE/'demo-court-scene.js').read_text(encoding='utf-8-sig')
ext += '\n' + (SOURCE/'demo-exploration.js').read_text(encoding='utf-8-sig')
ext += '\n' + (SOURCE/'demo-interactions.js').read_text(encoding='utf-8-sig')
fiction=json.loads((ROOT/'人物内容库_新编/凤阙长歌_原创对话事件与自主行为.json').read_text(encoding='utf-8'))
ext += '\nconst FICTION_DATA='+json.dumps(fiction,ensure_ascii=False,separators=(',',':')).replace('</','<\\/')+';\n'
cast=json.loads((SOURCE/'cast-data.json').read_text(encoding='utf-8'))
ext += '\nconst CAST_DATA='+json.dumps(cast,ensure_ascii=False,separators=(',',':')).replace('</','<\\/')+';\n'
revision=json.loads((SOURCE/'revision-dialogue.json').read_text(encoding='utf-8'))
ext += '\nconst REVISION_DATA='+json.dumps(revision,ensure_ascii=False,separators=(',',':')).replace('</','<\\/')+';\n'
ext += '\nconst STORY_DATA='+json.dumps(json.loads((SOURCE/'story-data.json').read_text(encoding='utf-8')),ensure_ascii=False,separators=(',',':')).replace('</','<\\/')+';\n'
ext += '\n' + (SOURCE/'demo-npc-mind.js').read_text(encoding='utf-8-sig')
ext += '\n' + (SOURCE/'demo-cast-life.js').read_text(encoding='utf-8-sig') if (SOURCE/'demo-cast-life.js').exists() else ''
ext += '\n' + (SOURCE/'demo-revision.js').read_text(encoding='utf-8-sig') if (SOURCE/'demo-revision.js').exists() else ''
ext += '\n' + (SOURCE/'demo-strife.js').read_text(encoding='utf-8-sig') if (SOURCE/'demo-strife.js').exists() else ''
ext += '\n' + (SOURCE/'demo-agency.js').read_text(encoding='utf-8-sig') if (SOURCE/'demo-agency.js').exists() else ''
ext += '\nconst COURT_VOICE_DATA='+json.dumps(json.loads((SOURCE/'court-voice-data.json').read_text(encoding='utf-8')),ensure_ascii=False,separators=(',',':')).replace('</','<\\/')+';\n'
ext += '\nconst COURTSHIP_DATA='+json.dumps(json.loads((SOURCE/'courtship-data.json').read_text(encoding='utf-8')),ensure_ascii=False,separators=(',',':')).replace('</','<\\/')+';\n'
ext += '\nconst AUDITION_ELITE_DATA='+json.dumps(json.loads((SOURCE/'audition-elite-data.json').read_text(encoding='utf-8')),ensure_ascii=False,separators=(',',':')).replace('</','<\\/')+';\n'
ext += '\n' + (SOURCE/'demo-courtship.js').read_text(encoding='utf-8-sig')
ext += '\nconst SOCIAL_TALK_DATA='+json.dumps(json.loads((SOURCE/'social-talk-data.json').read_text(encoding='utf-8')),ensure_ascii=False,separators=(',',':')).replace('</','<\\/')+';\n'
ext += '\n' + (SOURCE/'demo-social-talk.js').read_text(encoding='utf-8-sig')
ext += '\n' + (SOURCE/'demo-court-voice.js').read_text(encoding='utf-8-sig')
ext += '\n' + (SOURCE/'demo-audition-elite.js').read_text(encoding='utf-8-sig')
ext += '\nconst PALACE_LIFE_DATA='+json.dumps(json.loads((SOURCE/'palace-life-data.json').read_text(encoding='utf-8')),ensure_ascii=False,separators=(',',':')).replace('</','<\\/')+';\n'
ext += '\n' + (SOURCE/'demo-palace-life-v13.js').read_text(encoding='utf-8-sig')
ext += '\nconst LISTEN_FOLLOWUPS='+json.dumps(json.loads((SOURCE/'listen-followups.json').read_text(encoding='utf-8')),ensure_ascii=False,separators=(',',':')).replace('</','<\\/')+';\n'
ext += '\nObject.assign(LISTEN_FOLLOWUPS.rows,SOCIAL_TALK_DATA.followups);\n'
ext += '\n' + (SOURCE/'demo-private-talk.js').read_text(encoding='utf-8-sig')
ext += '\n' + (SOURCE/'demo-background-stories.js').read_text(encoding='utf-8-sig')
ext += '\n' + (SOURCE/'demo-everyday-talk.js').read_text(encoding='utf-8-sig')
ext += '\n' + (SOURCE/'demo-courier-notebook.js').read_text(encoding='utf-8-sig')
ext += '\nconst RUIN_DATA='+json.dumps(json.loads((SOURCE/'ruined-realm-data.json').read_text(encoding='utf-8')),ensure_ascii=False,separators=(',',':')).replace('</','<\\/')+';\n'
ext += '\nconst FRONTCOURT_DATA='+json.dumps(json.loads((SOURCE/'frontcourt-data.json').read_text(encoding='utf-8')),ensure_ascii=False,separators=(',',':')).replace('</','<\\/')+';\n'
ext += '\n' + (SOURCE/'demo-frontcourt.js').read_text(encoding='utf-8-sig')
ext += '\n' + (SOURCE/'demo-court-layout.js').read_text(encoding='utf-8-sig')
ext += '\n' + (SOURCE/'demo-approval-flow.js').read_text(encoding='utf-8-sig')
ext += '\n' + (SOURCE/'demo-ruined-realm.js').read_text(encoding='utf-8-sig')
ext += '\n' + (SOURCE/'demo-daliang-canon.js').read_text(encoding='utf-8-sig')

ext += '\nconst REALM_DATA='+json.dumps(json.loads((SOURCE/'simulation/realm-data.json').read_text(encoding='utf-8')),ensure_ascii=False,separators=(',',':')).replace('</','<\\/')+';\n'
ext += '\n' + (SOURCE/'simulation/realm-core.js').read_text(encoding='utf-8')
ext += '\n' + (SOURCE/'demo-selection-review.js').read_text(encoding='utf-8')
ext += '\n' + (SOURCE/'demo-simulation.js').read_text(encoding='utf-8')

ext += '\nconst WORLD16_DATA='+json.dumps(json.loads((SOURCE/'world/world-data-v16.json').read_text(encoding='utf-8')),ensure_ascii=False,separators=(',',':')).replace('</','<\\/')+';\n'
ext += '\n' + (SOURCE/'world/world-core-v16.js').read_text(encoding='utf-8')
ext += '\n' + (SOURCE/'demo-world-v16.js').read_text(encoding='utf-8')
ext += '\n' + (SOURCE/'demo-save-v16.js').read_text(encoding='utf-8')

boot=js.replace("render();if(!state.introSeen)intro();", ext+'\nrender();if(!state.introSeen)intro();')
world_payload=json.dumps(world,ensure_ascii=False,separators=(',',':'))
prefix=(SOURCE/'save/save-bootstrap-v16.js').read_text(encoding='utf-8')+'\n'+(SOURCE/'save/save-codec-v16.js').read_text(encoding='utf-8')+'\n'
out.write_text(style+extra+body+'<script>\n'+prefix+'const CONTENT='+payload+';\nconst WORLD_DATA='+world_payload+';\n'+boot+'\n</script></body></html>',encoding='utf-8')
for entry in (ROOT/'index.html', ROOT/'试玩_v16.html'):
    entry.write_bytes(out.read_bytes())
print(json.dumps({'output':str(out),'bytes':out.stat().st_size,'workbook_dialogue_rows':len(dialogue),'world_npcs':len(world['people'])+6},ensure_ascii=True))





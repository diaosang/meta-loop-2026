from pathlib import Path
import json
P=Path(__file__).resolve().parent
data={
 'version':'13.6','id':'ruined-realm','title':'风雨登基','intro':'先帝留下的不是盛世。库册上尚有银粮，真正能拨到御前的却一笔也没有。边镇欠饷，州县借赈，六部各守着旧例与旧人。百官伏在阶下，等的未必是圣旨，也可能是新帝先向谁低头。',
 'national':{'treasury':0,'grain':0,'arrears':96,'receivables':92,'private':8,'authority':18,'people':24,'army':26,'control':18,'threat':68,'tension':76,'training':6,'diplomacy':24},
 'local':{'prosperity':[18,32],'public':[18,30],'security':[16,30],'grain':[8,20],'health':[34,48],'waterRisk':[58,82],'corruption':[68,86],'literacy':[10,24]},
 'core':{'xu':{'loyalty':44,'ambition':72,'influence':80,'stance':'首辅守着旧有荐举与签押。他愿朝局不乱，却未必肯让新帝绕过自己。'},
 'ye':{'loyalty':28,'ambition':78,'influence':82,'stance':'户部熟悉各处仓库和商路。叶承钧能筹到钱粮，也会把代价说在前头。'},
 'jiang':{'loyalty':62,'ambition':30,'influence':42,'stance':'仍愿护着新帝，却没有足够的现银、兵马和门生替她把所有事兜住。'},
 'lu':{'loyalty':42,'ambition':55,'influence':60,'stance':'肯做实事，先要看朝廷能否把口粮送到军中。他守边，也在看新帝有没有办法。'}},
 'routes':[
  {'id':'inventory','title':'封旧库，点交未解银粮','description':'旧库实物尚在原经手处，未完成点交，不能当国库现银。遣人持御封清点，收回可核的一批；会触动原管库人的权力。','ap':1,'days':2,'money':24,'grain':36,'pool':'sealed','control':4,'tension':5,'influence':-4,'actor':'xu','tags':['law','merit','audit'],'reply':'“臣会交出原册。”许知衡将手按在封签上，稍停了一息，“御封既下，也请陛下让新旧经手当面点交，别只听一边的数字。”'},
  {'id':'collect','title':'催解已核实的旧税银','description':'只催核实的欠解，不向灾户添派。先收银18，再由尚有余粮的外仓接济粮24；从真实待解项扣除，路远，需三日。','ap':1,'days':3,'money':18,'grain':24,'pool':'receivables','control':3,'tension':3,'influence':-2,'actor':'jiang','tags':['care','law','thrift'],'reply':'姜太傅把催解名单压在御案边：“只催经手衙门，不催灾户。臣替陛下盯着回执；下面若拿这道旨意添征，便是另违一道旨。”'},
  {'id':'advance','title':'许叶氏先垫钱粮，另立借据','description':'叶氏可先垫银28、粮36，一日后送达；签下银本息42、粮还额40的借据，每月最多偿银6、粮4。叶承钧的影响力上升，皇权受制。','ap':1,'days':1,'money':28,'grain':36,'pool':'credit','control':-3,'tension':-3,'influence':12,'actor':'ye','tags':['thrift','clan'],'reply':'叶承钧将一张尚未落款的借据推到案前：“陛下眼下要粮，臣能先送。可垫付总得有个凭据。日后朝廷宽裕了，臣也不愿再为这笔旧账，站在殿里讨一句话。”'}],
 'pressure':{'title':'权臣留签，借急务索取荐举权','days':3,'delay':2,'holdback':6,
  'brief':'原经手衙门扣住了需补签的回执，承办差事因而迟两日。有人愿以自己荐来的办事官代签，条件是往后差遣先经他过目。这是一次具体的留签与索权，并不等于已经查明贪污或谋反。',
  'choices':[
   {'id':'verify','label':'另核原册，限两日交签','ap':1,'days':2,'control':4,'influence':-6,'tension':5,'text':'令无涉此事的官员交叉点验。保留已发生的两日迟滞；核实后补交原签，解除本次留解，不追认未经证实的罪名。'},
   {'id':'concede','label':'暂准其荐员代签，限定本案','ap':0,'days':0,'control':-4,'influence':8,'tension':-4,'text':'先放行回执，已误的日期不追回；对方的影响力上升。任事旧员仍记名负责，不凭口头应允直接新增亲族或官职。'},
   {'id':'rebuke','label':'当殿勒令交签，停其本案经手','ap':2,'days':0,'control':2,'influence':-8,'tension':10,'text':'解除本次留解，但激化朝中对立；停的是此案经手，不抹去原部主事及其他在办责任。'}]},
 'notes':['新档默认衰败开局；旧存档不强制归零。','低忠诚、强影响的臣子会留签迟延；每月最多形成一宗此类索权。','真实资源池与借据各自扣减；重载、翻看不能重复领取。','国家不会因开局贫困直接固定回合结束，须依实际局势逐步修复。']}
(P/'ruined-realm-data.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
print('ruined realm: 3 finite recovery routes, 3 minister pressure responses')

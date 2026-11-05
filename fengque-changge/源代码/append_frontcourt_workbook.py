from pathlib import Path
import json
from openpyxl import load_workbook
from openpyxl.styles import Font,PatternFill,Alignment
from openpyxl.utils import get_column_letter
ROOT=Path(__file__).resolve().parent.parent
BOOK=ROOT/'人物内容库_新编/凤阙长歌_万条对话事件与NPC自主行为.xlsx'
DATA=json.loads((ROOT/'源代码/frontcourt-data.json').read_text(encoding='utf-8'))
NEW=['V13.5六部职掌','V13.5施政差事','V13.5重大奏案','V13.5御批方案','V13.5廷议对白','V13.5前朝规则']
def snap(ws):return (ws.title,ws.sheet_state,str(ws.freeze_panes),list(map(str,ws.merged_cells.ranges)),[(c.coordinate,c.value,c.data_type) for row in ws for c in row if c.value is not None])
wb=load_workbook(BOOK);old=[n for n in wb.sheetnames if n not in NEW];before=[snap(wb[n]) for n in old]
for n in NEW:
 if n in wb:del wb[n]
def sheet(name,header):
 ws=wb.create_sheet(name);ws.append(header);return ws
depts=sheet(NEW[0],['部门ID','部门','职掌','任事能力字段','参考主张'])
for d in DATA['departments']:depts.append([d['id'],d['name'],d['scope'],d['skill'],DATA['principles'][d['principle']]])
tasks=sheet(NEW[1],['差事ID','部门','差事','说明','行动','国库银','仓粮','期限（日）','办成效果（原创数值）','主张标签'])
for t in DATA['tasks']:tasks.append([t['id'],t['dept'],t['name'],t['description'],t['ap'],t['money'],t['grain'],t['days'],json.dumps(t['effects'],ensure_ascii=False),','.join(t['tags'])])
events=sheet(NEW[2],['奏案ID','奏案','承办部门','等级','奏报','何以请旨','核验材料','参考资料ID'])
choices=sheet(NEW[3],['奏案ID','选择ID','御批','取舍','行动','国库银','仓粮','期限（日）','主张标签','办成效果'])
for t in DATA['events']:
 events.append([t['id'],t['title'],t['dept'],t['rank'],t['brief'],t['reason'],'\n'.join(t['evidence']),t['source']])
 for c in t['choices']:choices.append([t['id'],c['id'],c['label'],c['description'],1,c['money'],c['grain'],c['days'],','.join(c['tags']),json.dumps(c['effects'],ensure_ascii=False)])
talk=sheet(NEW[4],['奏案ID','人物/主张','类型','廷议原话'])
for event,voices in DATA['advice'].items():
 for key,line in voices.items():talk.append([event,DATA['principles'][key],'一般官员按主张发言',line])
for npc,voices in DATA['bespokeAdvice'].items():
 for event,line in voices.items():talk.append([event,{'xu':'许知衡','ye':'叶承钧','jiang':'姜太傅','lu':'陆景明'}[npc],'原有人物专属发言',line])
rules=sheet(NEW[5],['规则','实现口径'])
rows=[
 ('上朝与行动','每月15行动；首次入朝1行动，当日退朝不重开。翌日可入朝。翻册、听廷议免费。'),
 ('国库与内库','国库初始银180、仓粮260、欠支0、待清解税银36；待清解未计现银，宫中内库继续原账。单位为试玩抽象资源，不是史实财政额。'),
 ('御前权限','州县部院在原额内自行处置街巷排水、铺户争界等，不扣御前行动；跨府调粮、灾蠲、跨镇调兵与大案才请旨。'),
 ('地方先救急','灾地先赈，中央批续赈、跨府调拨与蠲缓，不让灾民等第一道御批。参考《明史》卷78特定记载。'),
 ('奏事触发','水患≥65；地方储粮≤38；边患≥60；国库<35或欠支>0；康健<42；吏弊≥57；本年开科且京畿吏弊≥35；邦交≥55且指定议约月。'),
 ('奏事节制','同类未决、在办、逾期与待补办不再新报；结办后至少隔两个月再按局势生成，每次待批最多3项。'),
 ('御批期限','呈报5日内请旨；逾期地方仍救急，续办受阻，一次性地方民心−3、生计−1。之后仍可御批。'),
 ('廷议对白','8类事件×7种主张56条；许、叶、姜、陆各8条专属32条，共88条，按当前案情与人物发言。'),
 ('部长能力','吏户刑工看政务，礼看文才，兵看武略；成年在职官员可候授，后宫在册者不兼领六部。'),
 ('执行评估','能力62%、操守评估23%、忠诚15%，加存档固定偏差−10至10；女帝对应能力以35为基准，每12点约加1分，62分验收。执行快照随存档保留。'),
 ('成效入账','六部成功落实100%，欠妥先落实45%；重大奏案成功100%，欠妥先落实55%。御批当日不先加预计收益。'),
 ('补办','每项可补办一次，1行动、原银35%向上取整、原粮25%向上取整；两日后复核，仅补尚未完成部分，不重加全额收益。'),
 ('六部容量','每部同时最多2项在办；同项同地一月一次。十二类任务可选八地。'),
 ('换任','每人独任一部，每部每日最多改任一次，耗1行动。原差事仍记原承办，补办可交现任。'),
 ('考课','每官每月1次、1行动；显示实际验收、欠妥与评分。操守风险只是评估，不能当作贪污定罪。'),
 ('按主张反应','任贤、恤民、节用、固边、守法、通商务农、护持门第各有关注；亲疏、政治能力、忠诚分别保留。'),
 ('御批与结果','御批反应与回奏反应分开记；优先原承办、现主事、许叶姜及不同部门相关官员。未触及的官员不统一加减。'),
 ('月度银入','各地按生计/9×税令系数×(1−吏弊/160)四舍五入，最低2，八地加总；未计吏弊的应解与实收差数加入待清解，未入现银。'),
 ('月度粮入','各地按(生计+民心)/30×康健/90四舍五入，最低1，八地加总。'),
 ('月度支出','俸银12+在职官数/12向下取整；驻防12；常费底数4（裁缓期间2）+每项在办差事2；另付此前欠支。仓粮需20。'),
 ('欠支','实付=min(现银+税入,当期应支+旧欠)，欠支留至下月，资源不变负数；缺饷缺粮有军民反应，并触发国用请旨。裁缓只减未来常费，不抹旧欠；清解不超真实待清解，补欠须扣实银。'),
 ('税令','轻徭：税入82%、各地民心+2生计+2；依额：100%、生计+1；临时加派：123%、民心−3生计−2。每月定一次、1行动，加派月底自动恢复依额。'),
 ('汛期与储粮','地方储粮每月+3，水患>65则另−6；第4至7月水患+4，其余月−3，治理可改。'),
 ('开科','一年一次，2行动、银22粮6，五日；验收后才生成一名有能力、关系与身世的实际候授官员，未通过不立即授职。'),
 ('女帝成长','治政、兵略、经义每项每月最多+2；任事成长与主动研习共享上限，达到上限不再收研习行动。能力参与后续执行评估。'),
 ('旧存档','补独立frontCourt字段，保留原有好感、后宫、人物、旧事与子女记录；国家钱粮跨月保存。'),
 ('原型范围','本版完善前朝经营，不宣称已补齐战争推演、完整官阶体系或传位系统；这些不以空按钮冒充。'),
 ('参考边界',DATA['note']),
 ('公式说明','Excel保留原公式，不在openpyxl中执行或伪称重算。新表是参数与规则文本，运行计算在离线JS中。')]
for s in DATA['sources']:rows.append(('参考 · '+s['title'],s['url']+'\n'+s['used']))
for row in rows:rules.append(row)
for ws in [wb[n] for n in NEW]:
 ws.freeze_panes='A2';ws.auto_filter.ref=ws.dimensions;ws.sheet_properties.tabColor='9E6C53'
 for i in range(1,ws.max_column+1):ws.column_dimensions[get_column_letter(i)].width=22 if i<3 else 46
 if ws.title==NEW[-1]:ws.column_dimensions['B'].width=120
 if ws.title==NEW[-2]:ws.column_dimensions['D'].width=110
 for row in ws:
  ws.row_dimensions[row[0].row].height=30 if row[0].row==1 else 80
  for c in row:
   c.alignment=Alignment(wrap_text=True,vertical='top');c.font=Font(name='微软雅黑',size=10,bold=c.row==1,color='FFFFFF' if c.row==1 else '483841');c.fill=PatternFill('solid',fgColor='89556A' if c.row==1 else 'FFF7F0' if c.row%2==0 else 'FFFFFF')
wb.save(BOOK);after=load_workbook(BOOK);assert after.sheetnames==old+NEW
assert [snap(after[n]) for n in old]==before
assert after[NEW[1]].max_row==13 and after[NEW[3]].max_row==25 and after[NEW[4]].max_row==89
report={'version':'13.5','priorSheetsComparedAndPreserved':len(old),'newSheets':NEW,'totalSheets':len(after.sheetnames),'tasks':12,'majorAffairs':8,'decisions':24,'courtArguments':88,'rules':len(rows),'reopenedAndCompared':True,'original12NonemptyCells':sum(len(snap(after[n])[-1]) for n in after.sheetnames[:12]),'original12Formulas':sum(c.data_type=='f' for n in after.sheetnames[:12] for row in after[n] for c in row),'formulaCalculation':'原公式保留，未在Excel计算引擎中重算。'}
(ROOT/'验证报告_v13_5_配表.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(report,ensure_ascii=False))

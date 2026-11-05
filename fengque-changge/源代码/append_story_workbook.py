from pathlib import Path
import json
from openpyxl import load_workbook
from openpyxl.styles import Font,PatternFill,Alignment
from openpyxl.utils import get_column_letter

ROOT=Path(__file__).resolve().parent.parent
BOOK=ROOT/'人物内容库_新编/凤阙长歌_万条对话事件与NPC自主行为.xlsx'
NEW=['V13.4家世来源','V13.4身世主线','V13.4身世接话选择','V13.4消息规则']
def snap(ws):return (ws.title,ws.sheet_state,str(ws.freeze_panes),list(map(str,ws.merged_cells.ranges)),[(c.coordinate,c.value,c.data_type) for row in ws for c in row if c.value is not None])
data=json.loads((ROOT/'源代码/story-data.json').read_text(encoding='utf-8'))
wb=load_workbook(BOOK);names=[n for n in wb.sheetnames if n not in NEW];before=[snap(wb[n]) for n in names]
for n in NEW:
 if n in wb:del wb[n]
origins=wb.create_sheet(NEW[0]);origins.append(['家世ID','家境','公开履历','影响心愿','旧物参考'])
for id,o in data['origins'].items():origins.append([id,o['name'],o['public'],o['pressure'],o['artifact']])
stories=wb.create_sheet(NEW[1]);stories.append(['分支/人物','名称/所属主线','心愿','矛盾性格','公开经历','初谈来路','熟悉后伤处','相知后隐情','自主日常','可查旧物','查证回报'])
choices=wb.create_sheet(NEW[2]);choices.append(['分支/人物','类型','分支键','女帝接话','NPC回答'])
all_arcs={**data['arcs'],**{id:{**data['arcs'][c['arc']],**c,'origin':c['originReply']} for id,c in data['core'].items()}}
for id,a in all_arcs.items():
 stories.append([id,a['name'],a['want'],a['temper'],a['public'],a['origin'],a['scar'],a['truth'],a['daily'],a['item'],a['evidence']])
 for key,say,reply in a['choices']:choices.append([id,'结局选择',key,say,reply])
 for i,(say,reply) in enumerate(a['follow']):choices.append([id,'倾听接话',str(i),say,reply])
rules=wb.create_sheet(NEW[3]);rules.append(['规则','口径'])
items=[('存档随机','每个新存档产生随机种子；根据实际家族、身份、技艺选择相容分支，生成后固定。'),
 ('家族约束','原有父母、祖辈、配偶不重写；同姓/派系不是血缘。明确世家、艺人、行伍等来路优先于随机。'),
 ('固定人设','许知衡、姜太傅、叶承钧、谢无咎用专属履历、心事、旧物、选择和接话；宋玉衡仍为琴艺世家。'),
 ('身世主线','8类：求仕受阻、求真认可、家族期许、重拾体面、责任与疲惫、报恩边界、实绩认可、受托递话；4位核心另有专属。'),
 ('获知顺序','公开履历可见；问过来路后，熟悉/好感40/信任35才谈伤处；相知/好感55/信任50且听过伤处才说尽隐情。'),
 ('来往查证','暗线关联本局真实在职官员；自述、荐引关系、文书与实际传出内容分开，不能凭一项定罪。'),
 ('后续玩法','对话与选择各占1次互动；可只听，不承诺前程；公平试才、复核文书两日后才回报。能力不足可不通过，未直接授官。'),
 ('自主日常','已有日常中穿插与身世相关的实际行动；不覆盖真实会面或其他两人往来；同日渲染不重复模拟。'),
 ('档案展示','后宫档案、宫室与交际页展示公开履历和已知旧事，不直接显示完整隐藏心声。'),
 ('邀约资格','至少渐熟、好感50、信任40，2个不同游戏日实际相处；成年人，且没有明显不快。'),
 ('邀约概率','合资格后按存档种子与NPC/当日确定22%日判定；渲染/读档不重抽，实际发生还受计划与现有邀约约束。'),
 ('邀约间隔','同一NPC7日内不重复主动邀约；所有渠道每天合计最多2份。'),
 ('谢无咎呈报','灾情、科场具告、互市、重大边情、受命查证回报等；市井例行案件/寻常功赏另册，不占宫门要事位。'),
 ('记事归位','人物动向、私笺约定、已知旧事放记事簿；首页只留实际要事。'),
 ('旧档与后代','旧档补身世，保留已知记录和已答应邀约；旧版低关系自动邀约收存不计失约；生成候选身份与生平读档后继续存在。'),
 ('生成方式','离线约束生成与原创内容配表；未调用在线大模型。')]
for r in items:rules.append(r)
for ws,widths in [(origins,[20,20,80,64,30]),(stories,[18,26,52,38,72,78,88,88,66,34,100]),(choices,[18,20,18,60,100]),(rules,[24,120])]:
 ws.freeze_panes='A2';ws.auto_filter.ref=ws.dimensions;ws.sheet_properties.tabColor='9C728A'
 for i,w in enumerate(widths,1):ws.column_dimensions[get_column_letter(i)].width=w
 for row in ws:
  ws.row_dimensions[row[0].row].height=32 if row[0].row==1 else 100
  for c in row:
   c.alignment=Alignment(wrap_text=True,vertical='top');c.font=Font(name='微软雅黑',size=10,bold=c.row==1,color='FFFFFF' if c.row==1 else '483841')
   c.fill=PatternFill('solid',fgColor='89556A' if c.row==1 else 'FFF7F0' if c.row%2==0 else 'FFFFFF')
wb.save(BOOK);after=load_workbook(BOOK)
assert after.sheetnames==names+NEW
assert [snap(after[n]) for n in names]==before
assert after[NEW[0]].max_row==8 and after[NEW[1]].max_row==13 and after[NEW[2]].max_row==49
report={'version':'13.4','priorSheetsComparedAndPreserved':len(names),'newSheets':NEW,'originRows':7,'storyRows':12,'choiceAndFollowupRows':48,'rules':len(items),'reopenedAndCompared':True,
 'original12NonemptyCells':sum(len(snap(after[n])[-1]) for n in after.sheetnames[:12]),'original12Formulas':sum(c.data_type=='f' for n in after.sheetnames[:12] for row in after[n] for c in row),'formulaCalculation':'保留公式，未在Excel计算引擎中重算。'}
(ROOT/'验证报告_v13_4_配表.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False))

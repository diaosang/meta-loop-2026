from pathlib import Path
import json
from openpyxl import load_workbook
from openpyxl.styles import Font,PatternFill,Alignment
from openpyxl.utils import get_column_letter
ROOT=Path(__file__).resolve().parent.parent;BOOK=ROOT/'人物内容库_新编/凤阙长歌_万条对话事件与NPC自主行为.xlsx'
data=json.loads((ROOT/'源代码/ruined-realm-data.json').read_text(encoding='utf-8'));NEW=['V13.6登基危局','V13.6破局筹措','V13.6权臣交涉']
def snap(ws):return (ws.title,ws.sheet_state,str(ws.freeze_panes),list(map(str,ws.merged_cells.ranges)),[(c.coordinate,c.value,c.data_type) for row in ws for c in row if c.value is not None])
wb=load_workbook(BOOK);print(json.dumps({'sheets':[(w.title,w.sheet_state) for w in wb.worksheets]},ensure_ascii=False));old=[n for n in wb.sheetnames if n not in NEW];before=[snap(wb[n]) for n in old]
for n in NEW:
 if n in wb:del wb[n]
a=wb.create_sheet(NEW[0]);a.append(['项目','开局数值或规则'])
for k,v in data['national'].items():a.append([k,v])
for k,v in data['local'].items():a.append(['八地'+k,str(v)])
for id,c in data['core'].items():a.append([id,json.dumps(c,ensure_ascii=False)])
for r in [('新旧档','新档与用户确认的重开使用ruined-realm标记；已玩旧档不强制归零。'),('执行','掌控低于60时，原执行评分减round((60-掌控)/6)；原固定偏差不重抽。'),('办成实绩','已验收的差事/奏案掌控+2；欠妥−1，每次结算一次。'),('留签触发','开局满3日、掌控<60、当前无未结交涉；主事影响≥50、忠诚<45、野心≥忠诚+15。每月最多1案。'),('拖延','一宗交涉最多拖一项实际在办差事2日，保留原拨款与原承办。'),('留解','未结交涉每月留本期实收最多6银，转回待解，未作现银。'),('旧欠','96俸饷旧欠正常结转；贫穷不是固定回合失败。'),('下月可用','每月1行动可催解真实待解旧项最多12银，3日；可1行动定月末留最多6现银续赈，欠俸后果保留。')]:a.append(r)
b=wb.create_sheet(NEW[1]);b.append(['策ID','名称','描述','行动','日数','银','粮','实际来源池','掌控','内斗','相关臣','影响力','人物回答'])
for t in data['routes']:b.append([t['id'],t['title'],t['description'],t['ap'],t['days'],t['money'],t['grain'],t['pool'],t['control'],t['tension'],t['actor'],t['influence'],t['reply']])
b.append(['monthly-collect','催解已核旧项','真实待解每月最多12银，预约时扣来源池；三日后入库。',1,3,12,0,'待解税银',0,0,'ye',0,'不向灾户添征，不重复征解。'])
b.append(['reserve','留续赈现银','一行动定保留6银，月结实付俸饷减少，余欠真实增加。',1,0,6,0,'已有月末现银',0,0,'ye',0,'不凭空增银，缺饷后果仍存。'])
c=wb.create_sheet(NEW[2]);c.append(['选择ID','选择','规则与后果','行动','核验日数','掌控','影响力','内斗'])
for t in data['pressure']['choices']:c.append([t['id'],t['label'],t['text'],t['ap'],t['days'],t['control'],t['influence'],t['tension']])
c.append(['debt','叶氏借据','银本息42、粮还额40；每月据实还最多银6粮4，先付原岁计，余不足留债。',0,0,-3,12,-3])
for ws in [wb[n] for n in NEW]:
 ws.freeze_panes='A2';ws.auto_filter.ref=ws.dimensions;ws.sheet_properties.tabColor='8B5A42'
 for i in range(1,ws.max_column+1):ws.column_dimensions[get_column_letter(i)].width=24 if i<3 else 42
 if ws.max_column==2:ws.column_dimensions['B'].width=120
 for row in ws:
  ws.row_dimensions[row[0].row].height=30 if row[0].row==1 else 82
  for cell in row:cell.alignment=Alignment(wrap_text=True,vertical='top');cell.font=Font(name='微软雅黑',size=10,bold=cell.row==1,color='FFFFFF' if cell.row==1 else '483841');cell.fill=PatternFill('solid',fgColor='89556A' if cell.row==1 else 'FFF7F0' if cell.row%2==0 else 'FFFFFF')
wb.save(BOOK);after=load_workbook(BOOK);assert after.sheetnames==old+NEW;assert [snap(after[n]) for n in old]==before
report={'version':'13.6','priorSheetsComparedAndPreserved':len(old),'newSheets':NEW,'totalSheets':len(after.sheetnames),'reopenedAndCompared':True,'original12NonemptyCells':sum(len(snap(after[n])[-1]) for n in after.sheetnames[:12]),'original12Formulas':sum(c.data_type=='f' for n in after.sheetnames[:12] for row in after[n] for c in row),'formulaCalculation':'保留原公式，未在Excel计算引擎中重算。'}
(ROOT/'验证报告_v13_6_配表.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(report,ensure_ascii=False))

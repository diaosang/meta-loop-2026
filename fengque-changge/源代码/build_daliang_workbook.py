from pathlib import Path
import json, hashlib
from openpyxl import Workbook, load_workbook
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.utils import get_column_letter
P=Path(__file__).resolve().parent;root=P.parent
data=json.loads((P/'daliang-canon-data.json').read_text(encoding='utf-8'))
old=root/'人物内容库_新编/凤阙长歌_万条对话事件与NPC自主行为.xlsx'
hash0=hashlib.sha256(old.read_bytes()).hexdigest()
prior=load_workbook(old,read_only=True,data_only=False)
source_sheets=[{'name':s.title,'state':s.sheet_state} for s in prior];prior.close()
wb=Workbook();wb.remove(wb.active)
def sheet(name,headers,rows):
 s=wb.create_sheet(name);s.append(headers)
 for r in rows:s.append(r)
 s.freeze_panes='A2';s.auto_filter.ref=s.dimensions;s.sheet_view.showGridLines=False
 for c in s[1]:c.font=Font(name='微软雅黑',bold=True,color='FFFFFF');c.fill=PatternFill('solid',fgColor='784459');c.alignment=Alignment(wrap_text=True,vertical='center')
 for row in s.iter_rows(min_row=2):
  for c in row:c.font=Font(name='微软雅黑',size=10,color='46343D');c.alignment=Alignment(wrap_text=True,vertical='top')
 for i in range(1,len(headers)+1):s.column_dimensions[get_column_letter(i)].width=24 if i<3 else 56
 s.row_dimensions[1].height=30
sheet('大梁与登基',['条目','设定','游戏表现'],[['王朝','大梁，立国百余年','不将改元误作另建王朝'],['女帝','十九岁九公主，先帝最后在世皇嗣','姜叶拥立、未受完整储君教养；新局政略18'],['年号','景和','沿用已有月份与日程循环'],*[[f'序章{i+1}',p,'新局序章与遗局卷册'] for i,p in enumerate(data['intro'])]])
sheet('核心人物与边界',['ID','姓名','身份','公开来路','私心','新局忠诚','新局野心','新局影响','不可越过的边界'],[[id,c['name'],c['role'],c['public'],c['want'],c['loyalty'],c['ambition'],c['influence'],{'xu':'忠君；不入后宫，不以册封交换首辅印','jiang':'亲近不等于放弃姜氏权力，非无条件慈师','xie':'假内侍真相由本人交心后说明；忠诚旧事不自动捏造成救命之恩'}[id]] for id,c in data['core'].items()])
sheet('许案调查链',['ID','步骤','真实信源','行动','等待日数','前置','回奏与可证范围'],[[t['id'],t['title'],t['source'],t['ap'],t['days'],'、'.join(t.get('requires',[])),t['result']] for t in data['tasks']])
sheet('姜叶荐举',['选择','行动','任命','所选家影响','另一家影响','掌控','嫌隙','实际执行影响'],[['取姜氏所荐',1,'当前可用现任人物接刑部主事',6,-2,-1,6,'该被荐者在刑部的执行评分−3，不影响其他部'],['取叶氏所荐',1,'当前可用现任人物接刑部主事',6,-2,-1,6,'该被荐者在刑部的执行评分−3，不影响其他部'],['公开按政略择优',1,'可用官员中政略较高者接刑部主事',-3,-3,3,0,'无荐举执行减项；许知衡信任+2']])
rows=[[r['id'],r['npc'],r['category'],r['topic'],['初识','渐熟','相知'][r['minTier']],r['reply']] for r in data['dialogue']]
rows += [[f'flirt:{id}:{tier}:{i}',id,'flirt','按既有暧昧阶段',str(tier),text] for id,stages in data['flirt'].items() for tier,texts in enumerate(stages) for i,text in enumerate(texts)]
sheet('新正文与亲疏',['ID','人物','类别','话题','最低阶段','NPC直接回答'],rows)
sheet('迁移与校验',['事项','规则'],[['旧存档','保留钱粮、亲疏、子嗣、已发生的册封，不用新开局数值覆盖玩家进度；完整登基关系需自行导出后确认新局'],['历史配表','原36张底表保留；本表是V14新设定与新玩法的覆盖层，运行时以daliang-canon-data.json为据'],['去重','关心闲谈只显示NPC回复，最多保留每人240条真实回复；预览不计入'],['旧案裁决','交叉互核后可另庭重审或政治交换；两者后果不同，未知主使保持未知']])
out=root/'人物内容库_新编/凤阙长歌_大梁设定与玩法_v14.xlsx';wb.save(out)
check=load_workbook(out,read_only=True,data_only=False)
assert len(check.sheetnames)==6 and check['新正文与亲疏'].max_row==len(rows)+1
assert check['核心人物与边界']['B3'].value=='姜禹瀛'
assert all(c.data_type!='f' for s in check for row in s for c in row)
names=check.sheetnames;check.close()
assert hashlib.sha256(old.read_bytes()).hexdigest()==hash0
report={'version':'14.0','newWorkbook':out.name,'newSheets':names,'dialogueRows':len(rows),'historicalWorkbookSheets':source_sheets,'historicalWorkbookSHA256':hash0,'historicalWorkbookUnchanged':True,'reopenedAndValidated':True,'formulas':'新增设定表无公式；历史底表未重算。'}
(root/'验证报告_v14_配表.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'newSheets':len(names),'dialogueRows':len(rows),'historicalSheets':len(source_sheets),'unchanged':True},ensure_ascii=False))

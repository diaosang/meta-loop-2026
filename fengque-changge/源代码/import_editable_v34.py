"""Import edited XLSX cells as validated text overrides and town data; no Excel macros."""
from pathlib import Path
from zipfile import ZipFile
from xml.etree import ElementTree as E
import json,sys
BASE=Path(__file__).resolve().parent;ROOT=BASE.parent
def sheets(path):
 ns={'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
 with ZipFile(path) as z:
  shared=[]
  if 'xl/sharedStrings.xml' in z.namelist():shared=[''.join(x.itertext()) for x in E.fromstring(z.read('xl/sharedStrings.xml'))]
  rel={x.attrib['Id']:x.attrib['Target'] for x in E.fromstring(z.read('xl/_rels/workbook.xml.rels'))}
  for sh in E.fromstring(z.read('xl/workbook.xml')).find('m:sheets',ns):
   target=rel[sh.attrib['{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id']];target=target.lstrip('/') if target.startswith('/') else 'xl/'+target
   rows=[]
   for row in E.fromstring(z.read(target)).findall('m:sheetData/m:row',ns):
    vals={}
    for c in row:
     if c.find('m:f',ns) is not None:raise ValueError('不接受公式：'+sh.attrib['name']+' '+c.attrib['r'])
     col=0
     for ch in c.attrib['r']:
      if ch.isdigit():break
      col=col*26+ord(ch)-64
     value=c.find('m:v',ns);value=value.text if value is not None else ''
     if c.attrib.get('t')=='s':value=shared[int(value)]
     elif c.attrib.get('t')=='inlineStr':
      inline=c.find('m:is',ns);value=''.join(inline.itertext()) if inline is not None else ''
     vals[col-1]=value
    rows.append([vals.get(i,'') for i in range(max(vals,default=-1)+1)])
   yield sh.attrib['name'],rows
def import_book(path):
 data=json.loads((BASE/'town-v34-data.json').read_text(encoding='utf-8'));overrides=[];cache={};dialogue=[]
 for title,rows in sheets(path):
  if title=='全部文案':
   for r in rows[1:]:
    if len(r)<8 or not r[3] or r[3]==r[2]:continue
    file=(ROOT/r[1]).resolve()
    if ROOT.resolve() not in file.parents or file.suffix not in ['.js','.json']:raise ValueError('非法来源路径')
    source=cache.setdefault(str(file),file.read_text(encoding='utf-8-sig'));start,end=int(r[5]),int(r[6])
    if source[start:end]!=r[7]:raise ValueError('来源已变化，不能误覆盖：'+r[0]+' '+r[1])
    value=r[3]
    if r[4]=='template':replacement=value.replace('\\','\\\\').replace('`','\\`').replace('${','\\${')
    else:replacement=json.dumps(value,ensure_ascii=False)
    overrides.append({'file':r[1],'start':start,'end':end,'raw':r[7],'replacement':replacement})
  elif title=='原始万条对白':
   if len(rows)>4:
    headers=rows[3]
    for vals in rows[4:]:
     row=dict(zip(headers,vals));key=row.get('对白ID',row.get('对话ID',''))
     if key:dialogue.append(row)
  elif title=='新增互动效果':
   for r in rows[1:]:
    d=next((d for d in data['reactions'] if d['id']==r[0]),None)
    if not d:raise ValueError('动作ID不存在：'+str(r[0]))
    for i,k in enumerate(['ap','money','aff','trust','skill'],2):
     v=int(r[i]);lo,hi=(0,6) if k=='ap' else (0,10) if k=='skill' else (-9999,9999) if k=='money' else (-100,100)
     if not lo<=v<=hi:raise ValueError(k+'超出可用范围')
     d[k]=v
    d['label']=r[1];d['reply']=r[7]
  elif title=='新增NPC':
   for r in rows[1:]:
    d=next((d for d in data['people'] if d['id']==r[0]),None)
    if not d:raise ValueError('NPC ID不存在')
    if r[2] not in ['男','女'] or not 18<=int(r[3])<=55:raise ValueError('新增人物须为18至55岁成年人')
    d.update(name=r[1],gender=r[2],age=int(r[3]),role=r[4],bio=r[5],skill=r[6],shop=r[7])
  elif title=='新增店铺':
   for r in rows[1:]:
    d=next((d for d in data['shops'] if d['id']==r[0]),None)
    if not d:raise ValueError('店铺ID不存在')
    income=int(r[4])
    if not 0<=income<=100:raise ValueError('月基础分红须在0至100之间')
    d.update(name=r[1],item=r[2],skill=r[3],baseIncome=income,requestItem=r[5],lines=r[6:9])
 skills={'admin','literature','military','charm'};shopids={s['id'] for s in data['shops']}
 if any(p['skill'] not in skills or p['shop'] not in shopids for p in data['people']) or any(s['skill'] not in skills or s['requestItem'] not in shopids for s in data['shops']):raise ValueError('专长或店铺ID不在配置内')
 (BASE/'town-v34-data.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
 (BASE/'text-overrides-v34.json').write_text(json.dumps(overrides,ensure_ascii=False,indent=2),encoding='utf-8')
 (BASE/'dialogue-edits-v34.json').write_text(json.dumps(dialogue,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
 print('导入成功：'+str(len(overrides))+'处文案替换、12位新人物、6家店面及互动效果。重新构建HTML即可生效。')
if __name__=='__main__':
 if len(sys.argv)!=2:raise SystemExit('用法：python 源代码/import_editable_v34.py 你的配表.xlsx')
 import_book(sys.argv[1])

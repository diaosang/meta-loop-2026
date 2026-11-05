"""Append V13 authoring sheets without replacing V12 content or its sheet order."""
from pathlib import Path
import json
from openpyxl import load_workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.workbook.properties import CalcProperties
from openpyxl.utils import get_column_letter

ROOT = Path(__file__).resolve().parent.parent
BOOK = ROOT / '人物内容库_新编/凤阙长歌_万条对话事件与NPC自主行为.xlsx'
NEW_SHEETS = ['V13宫墙对白', 'V13互动规则', 'V13.1日常修订', 'V13.1倾诉接话',
              'V13.2情意递进','V13.2选秀底稿','V13.2面圣对白','V13.2规则','V13.3日常亲疏','V13.3日常接话','V13.3规则']
NAMES = {'xu':'许知衡', 'jiang':'姜太傅', 'ye':'叶承钧', 'xie':'谢无咎', 'song':'宋玉衡', 'lu':'陆景明'}
SCENES = {'snack':'分你半块', 'jealous':'有据的醋意', 'invite':'自主小请帖', 'gift':'记得偏好的赠礼',
          'voice':'原有话题新增对白', 'giftAfter':'赠礼后的接话', 'echo':'两日后的回笺'}
PHASES = {'snack':['开场','认真分食','熟悉后逗趣','留出空间'],
          'jealous':['开场','认真倾听','轻轻逗趣','说明安排','两人同席'],
          'invite':['开场','当日赴约','明确约明日','诚实婉拒'],
          'gift':['近期第1种','近期第2种','近期第3种'],
          'voice':['闲谈·兴趣','关怀·宽慰','调情·想念'],
          'giftAfter':['认真收下回应','下次由他挑选','道别让他慢慢尝'],
          'echo':['心事较平稳','仍有一点酸','尊重各自安排']}
GATES = {'snack':'会面→闲谈；初次披露偏好；严重负面心境时先认真沟通',
         'jealous':'成年可恋爱已入宫；好感≥35、暧昧≥8；有亲见/公开膳单/真实友人往来消息',
         'invite':'自己的计划有进展；好感≥35、信任≥30、心境平稳；非巡游中',
         'gift':'已亲口披露偏好；内库≥3；当日未送；近期语义不重复',
         'voice':'按原互动类别、关系、心境选取；调情仍使用原有边界',
         'giftAfter':'送礼后在同一段对话中接话；熟悉后才可逗趣',
         'echo':'争宠接话后第2日及以后处理一次；根据心境与选择回信'}

RULES = [
 ('L13-R01','一段有来有往的对白','见面1行动，最多3次互动','开场与接话各占1次互动；关窗可续谈，不重复开场奖励。'),
 ('L13-R02','亲口知道偏好','闲谈→分你半块','100名人物可按性格回应，六名原有核心人物有专属开场；披露后档案展示。'),
 ('L13-R03','按偏好赠礼','已披露；内库3；每日1次','赠礼有回应，也能继续接话；沿用原每日好感上限，近期不重复三种赠礼语义。'),
 ('L13-R04','一点逗趣','好感≥40、信任≥45；怒意及受伤均<25','熟悉后才开放玩笑；约明日这一项按邀约规则处理。'),
 ('L13-R05','认真对待不快','恼怒/疏离/委屈/失望/戒备','不以可爱闲聊顶替严重心事；原关怀、沟通与关系边界继续生效。'),
 ('L13-R06','有根据的争宠','已入宫、可恋爱、成年；好感≥35、暧昧≥8','消息记录事实ID、被陪伴者、来源及获知时点；每日至多3个新争宠剧情。'),
 ('L13-R07','御花园亲见','公开散步或赏花；午后同地点','不在该地的人不会凭空知情；同一事实只处理一次。'),
 ('L13-R08','公开膳单','公开晚膳','内廷按日常安排知情；明确展示从膳单得知，不伪装为偷听。'),
 ('L13-R09','朋友传话','已知事实；双方真实日常记录有见面；双向关系≥55','次日及之后才可能由朋友转述；保留实际传话者来源。'),
 ('L13-R10','私下的相处','普通见面或原有亲密互动','不自动广播全后宫；沿用原有本人意愿与拒绝规则。'),
 ('L13-R11','两个人一起用茶','争宠第4分支；额外1行动；另一位仍在宫中','两人各自回应；双向关系各+2，更新真实日常与记忆，双方均有后续回笺。'),
 ('L13-R12','自主小请帖','计划为seekcare/prepare/learn/walk并有进展','每人间隔≥7日、每日最多2张、未读邀请总量上限3；尊重婉拒后3日空档。'),
 ('L13-R13','说得准的约定','邀约接话中约明日','只有约定当日见面才算守约；提前见面不清空约定。错过沿用原失约机制。'),
 ('L13-R14','坦诚说明安排','婉拒请帖或留出空间','不因诚实拒绝额外扣好感；未赴已答应的约定仍受原失约机制约束。'),
 ('L13-R15','两日后的回声','争宠已回应；到期处理一次','已平复、仍在意、留出空间各有不同回信；不把一次安慰写成永久释怀。'),
 ('L13-R16','共同小物件','分点心剧情完成且未选择独处','宫墙小事面板可回看纪念笺及其来源；重复点击不重复领奖励。'),
 ('L13-R17','旧存档迁移','沿用fengque-demo-v4','在旧对象上新增palaceLife，保留人物情绪、朝堂案件、皇嗣及其他原字段。'),
 ('L13-R18','跨代王朝','沿用V12皇嗣与继位系统','保留子嗣养育、特质传承和继位后继续王朝，不改成固定回合终局。'),
]

def snapshot(ws):
    return {'name':ws.title, 'rows':ws.max_row, 'columns':ws.max_column, 'state':ws.sheet_state,
            'merged':sorted(map(str,ws.merged_cells.ranges)), 'filter':ws.auto_filter.ref,
            'freeze':str(ws.freeze_panes), 'charts':len(ws._charts), 'images':len(ws._images),
            'cells':[(c.coordinate,c.value,c.data_type) for row in ws for c in row if c.value is not None]}

def main():
    data=json.loads((ROOT/'源代码/palace-life-data.json').read_text(encoding='utf-8'))
    wb=load_workbook(BOOK)
    before=[snapshot(s) for s in wb if s.title not in NEW_SHEETS]
    old_names=[x['name'] for x in before]
    for name in NEW_SHEETS:
        if name in wb: del wb[name]
    dialogue=wb.create_sheet(NEW_SHEETS[0])
    dialogue.append(['对白ID','口吻/人物','NPC专属ID','场景','环节/选择','前置与边界','完整回应','来源键'])
    number=0
    for personality,profile in data['profiles'].items():
        for kind in SCENES:
            for i,text in enumerate(profile[kind]):
                number+=1
                dialogue.append([f'L13-D{number:03}',personality,'',SCENES[kind],PHASES[kind][i],GATES[kind],text,f'profiles.{personality}.{kind}[{i}]'])
    bespoke_kind={'snack':('snack',0),'share':('snack',1),'tease':('snack',2),'space':('snack',3),'jealous':('jealous',0)}
    for npc,profile in data['bespoke'].items():
        for key,text in profile.items():
            if key=='food':continue
            kind,index=bespoke_kind[key];number+=1
            dialogue.append([f'L13-D{number:03}',NAMES[npc],npc,SCENES[kind],PHASES[kind][index],GATES[kind],text,f'bespoke.{npc}.{key}'])
    for personality,profile in data['profiles'].items():
        number+=1
        dialogue.append([f'L13-D{number:03}',personality,'','两人同席','受邀的另一位','女帝邀请两人同席；不套用告辞分支',profile['atTea'],f'profiles.{personality}.atTea'])
    assert number==339
    assert len({r[6].value for r in dialogue.iter_rows(min_row=2)})==339
    rules=wb.create_sheet(NEW_SHEETS[1]);rules.append(['规则ID','玩法','触发/成本','实际行为与限制'])
    for row in RULES:rules.append(row)
    revised=wb.create_sheet(NEW_SHEETS[2]);revised.append(['原对白ID','类别','话题','口吻','原回复（对照）','修订后的完整回复'])
    edits=json.loads((ROOT/'源代码/natural-talk-revision.json').read_text(encoding='utf-8'))
    for item in edits['rows']:revised.append([item['id'],item['category'],item['topic'],item['personality'],item['before'],item['after']])
    follow=wb.create_sheet(NEW_SHEETS[3]);follow.append(['开场对白ID','开场说了什么','女帝接话','NPC随后回应','消耗与保存'])
    openings={r['id']:r['reply'] for r in json.loads((ROOT/'源代码/court-voice-data.json').read_text(encoding='utf-8'))['rows']}
    continuations=json.loads((ROOT/'源代码/listen-followups.json').read_text(encoding='utf-8'))['rows']
    for id,choices in continuations.items():
        for c in choices:follow.append([id,openings[id],c['say'],c['reply'],'接话1次互动；未完3日内可续；同日完成后不换另一件烦恼'])
    courtship=json.loads((ROOT/'源代码/courtship-data.json').read_text(encoding='utf-8'))
    elite=json.loads((ROOT/'源代码/audition-elite-data.json').read_text(encoding='utf-8'))
    pacing=wb.create_sheet(NEW_SHEETS[4]);pacing.append(['对白ID','人物/性格','阶段','话题','动作神态','NPC完整回应'])
    tiers={'first':'初试羞赧','reserved':'敛情守礼','admonish':'熟稔数落','open':'敞开心意'}
    topics={'compliment':'被夸赞','miss':'被问想念','confess':'被表明心意'}
    for r in courtship['rows']:pacing.append([r['id'],r['npc'] or r['personality'],tiers[r['tier']],topics[r['topic']],r['stage'],r['reply']])
    candidates=wb.create_sheet(NEW_SHEETS[5]);candidates.append(['家门','名字底稿','突出条件','明确家世','仪容描写','专长','等级','魅力','专长能力'])
    for c in elite['candidates']:candidates.append([c['clan'],c['given'],c['kind'],c['background'],c['appearance'],c['skill'],c['level'],c['charm'],c['ability']])
    audience=wb.create_sheet(NEW_SHEETS[6]);audience.append(['性格','问话','面圣动作','NPC完整回应'])
    for kind,lines in elite['answers'].items():
        for i,line in enumerate(lines):audience.append([kind,['家世来意','所学专长','是否留牌'][i],elite['fear'][kind],line])
    pacing_rules=wb.create_sheet(NEW_SHEETS[7]);pacing_rules.append(['规则','口径'])
    definitions=[('初次试探','首个成功的暧昧回应为初试；高数值本身不跳过初见。'),('守礼回应','之后两个成功回应，仍保持君臣礼数。'),
                 ('熟稔数落','第4个成功回应显出熟稔的责意；不是对主控敌对训斥。'),('敞开心意','累计至少4次成功回应；好感65、信任55、暧昧25；至少3个不同游戏日有实际暧昧互动。'),
                 ('进度计算','只在真正消耗互动次数后记进度；渲染、读档和问话预览不记。每个游戏日首次成功暧昧互动增加信任2点，重复点击不刷信任。'),('旧存档','从已记录的暧昧话题推断旧进度；已有进度继续保留。'),
                 ('显示','主控台词保留为内部上下文；正文只显示动作和NPC回应。'),('选秀年龄','入场者18—25岁；后续新一代按实际年龄生成。'),
                 ('选秀资质','门第明确出众，或魅力90，或专长能力90，或专长达到名家8级；至少一项。'),('殿前敬畏','所有候选初次面圣皆敬畏皇权；高好感不跳过面圣礼数。'),
                 ('人物意愿','仍记录是否愿留；自请撤牌者不能被选择。'),('生成底稿','新家世是明确新设定；不把现有人物普通籍贯擅改成名门。')]
    for r in definitions:pacing_rules.append(r)
    social=json.loads((ROOT/'源代码/social-talk-data.json').read_text(encoding='utf-8'))
    social_rows=wb.create_sheet(NEW_SHEETS[8]);social_rows.append(['对白ID','人物/性格','亲疏','类别','话题','动作神态','完整回应'])
    tiers3={'stranger':'初识守礼','familiar':'渐熟琐事','trusted':'相知心事'}
    for r in social['rows']:social_rows.append([r['id'],r['npc'] or r['personality'],tiers3[r['tier']],r['category'],r['topic'],r['stage'],r['reply']])
    social_follow=wb.create_sheet(NEW_SHEETS[9]);social_follow.append(['开场ID','主控接话选项','该选项对应的NPC回应/动作','叙事显示'])
    for id,choices in social['followups'].items():
        for c in choices:social_follow.append([id,c['say'],c['reply'],bool(c.get('narrative'))])
    social_rules=wb.create_sheet(NEW_SHEETS[10]);social_rules.append(['规则','口径'])
    for r in [
        ('亲疏覆盖','闲谈近况/故乡/兴趣；关心倾听/宽慰/赠礼/出游小礼物/下月约定。六名核心人物使用专属生平，其他人物使用本人的性格与真实专长。'),
        ('初识','好感、封位不直接跳过初识。旧识仍记得原有人设，不等于已经愿意私下交心。'),
        ('渐熟','至少3个有效话题、2个不同游戏日；好感25、信任25。'),
        ('相知','至少9个有效话题、4个不同游戏日；好感55、信任50。'),
        ('有效话题','只有实际扣1次互动才记；同日同一话题只记1次；每日最多3次进展，前两个新话题各加信任1。开场和同一件事的接话合记一次。'),
        ('跨日续谈','同日去重；跨日仍可谈当前生活，优先选择未听过的变体。日历、渲染、预览、回看均不增加亲疏。'),
        ('当前心境','恼怒、疏离、失望、委屈、吃醋优先回应当前问题，不拿温馨闲话覆盖；严重不快时暂停旧的轻松接话。'),
        ('倾听续接','54个新开场各有两条对应接话；未完3日内可续，同日完成只回看；进入关心恢复正确原话，0次互动也能回看。'),
        ('题材边界','陌生时不将求陪伴、藏礼物或独处计划直接当作亲密邀约；私家来信和部分亲密专属旧事先经熟悉再问。'),
        ('人物动向','原事实加人物名字，首页最多3位不同人物，重复的同文事实合并；练习内容来自真实专长。'),
        ('旧档迁移','保留原存档键、人物数值、案件、皇嗣和继位；用能匹配实际相处记录的旧对白迁移进度，纯预览不记。'),
        ('对白来源','本离线Demo按设定、心境、亲疏和经历选择原创配表回应，未接入在线大模型。')]:social_rules.append(r)
    for ws,widths in [(dialogue,[15,18,13,23,23,53,88,48]),(rules,[15,24,55,90]),(revised,[42,14,18,18,76,76]),(follow,[42,72,50,75,42]),
                      (pacing,[46,20,18,16,70,84]),(candidates,[20,16,18,74,70,16,12,12,14]),(audience,[20,18,76,84]),(pacing_rules,[24,110]),(social_rows,[46,20,18,14,20,60,90]),(social_follow,[46,54,90,14]),(social_rules,[24,110])]:
        ws.freeze_panes='A2';ws.auto_filter.ref=ws.dimensions
        ws.sheet_properties.pageSetUpPr.fitToPage=True
        ws.sheet_properties.tabColor='B87D8C'
        ws.print_title_rows='1:1';ws.page_setup.orientation='landscape';ws.page_setup.paperSize=ws.PAPERSIZE_A3
        ws.page_setup.fitToWidth=1;ws.page_setup.fitToHeight=0
        for i,width in enumerate(widths,1):ws.column_dimensions[get_column_letter(i)].width=width
        for c in ws[1]:c.fill=PatternFill('solid',fgColor='89556A');c.font=Font(name='微软雅黑',size=11,bold=True,color='FFFFFF');c.alignment=Alignment(vertical='center',wrap_text=True)
        ws.row_dimensions[1].height=32
        for row in ws.iter_rows(min_row=2):
            ws.row_dimensions[row[0].row].height=64 if ws==dialogue else 72
            for c in row:
                c.font=Font(name='微软雅黑',size=10,color='483841')
                c.alignment=Alignment(vertical='top',wrap_text=True)
                c.fill=PatternFill('solid',fgColor='FFF7F0' if c.row%2==0 else 'FFFFFF')
                c.border=Border(bottom=Side(style='hair',color='E9D8DA'))
    # Keep all original sheet content and formulas; append authoring sheets at the end.
    # openpyxl preserves formula expressions but does not recalculate their cached results.
    if wb.calculation is None:wb.calculation=CalcProperties()
    wb.calculation.fullCalcOnLoad=True
    wb.save(BOOK)
    reopened=load_workbook(BOOK)
    assert reopened.sheetnames==old_names+NEW_SHEETS
    after=[snapshot(reopened[n]) for n in old_names]
    assert before==after, 'Original worksheet content/metadata changed'
    assert reopened[NEW_SHEETS[0]].max_row==340
    assert reopened[NEW_SHEETS[1]].max_row==19
    assert reopened[NEW_SHEETS[2]].max_row==102
    assert reopened[NEW_SHEETS[3]].max_row==43
    assert reopened[NEW_SHEETS[4]].max_row==244
    assert reopened[NEW_SHEETS[5]].max_row==9
    assert reopened[NEW_SHEETS[6]].max_row==37
    assert reopened[NEW_SHEETS[8]].max_row==271
    assert reopened[NEW_SHEETS[9]].max_row==109
    report={'version':'13.3','originalSheets':[{'name':s['name'],'rows':s['rows'],'columns':s['columns'],'state':s['state']} for s in before],
            'preservedOriginalCells':sum(len(s['cells']) for s in before),
            'preservedOriginalFormulas':sum(c[2]=='f' for s in before for c in s['cells']),
            'newSheets':NEW_SHEETS,'newCompleteReplies':339,'revisedOrdinaryReplies':101,'listenContinuations':42,'newRules':len(RULES),'courtshipResponses':243,'eliteCandidateTemplates':8,'auditionAnswers':36,'reopenedAndCompared':True,'socialResponses':270,'socialFollowups':108,
            'formulaCalculation':'保留原6个公式，未在Excel计算引擎中重算。'}
    (ROOT/'验证报告_v13_3_配表.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps(report,ensure_ascii=False))

if __name__=='__main__':main()

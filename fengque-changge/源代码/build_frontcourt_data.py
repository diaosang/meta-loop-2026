from pathlib import Path
import json,runpy
P=Path(__file__).resolve().parent
depts=[
 ('personnel','吏部','选任、考课与官员履职','admin','merit'),('revenue','户部','国库、田赋、仓粮与赈济','admin','thrift'),
 ('rites','礼部','贡举、学校与邦交礼仪','literature','merit'),('war','兵部','边防、军饷与兵员整训','military','security'),
 ('justice','刑部','刑名复核与依法审理','admin','law'),('works','工部','水利、道路与工程估验','admin','care')]
tasks=[
 ('audit','personnel','考课核绩','核对经手事务和原始回册；看实绩，不按亲疏评等。',1,10,0,3,{'authority':2,'corruption':-4},['merit','law']),
 ('inspect','personnel','选派清查','派员复核地方请托、积案与隐匿丁田，按实记功过。',1,12,0,4,{'security':3,'corruption':-6},['law','merit']),
 ('granary','revenue','整储仓粮','支银采买、核对收储；所购实际入仓后才增粮。',1,16,0,3,{'grain':38},['thrift','care']),
 ('farming','revenue','劝课农桑','安排农时、修整田间水路，月底再见收成变化。',1,14,0,4,{'prosperity':5,'waterRisk':-3},['care','growth']),
 ('school','rites','修学置书','向地方书院与学校供书，先验原有学舍再列支。',1,16,0,4,{'literacy':7,'public':2},['merit','care']),
 ('exam','rites','开科取士','本年度一次；独立考校后才列入可授差遣名册。',2,22,6,5,{'talent':1,'authority':1},['merit','law']),
 ('training','war','整训边军','补齐轮训、验点兵额，避免单纯添报纸面兵数。',1,18,12,3,{'training':6,'army':3,'threat':-4},['security','merit']),
 ('garrison','war','检点屯戍','检点守备与军粮出入，不因报功漂亮便略过实数。',1,15,8,4,{'security':5,'corruption':-3,'threat':-3},['security','law']),
 ('review','justice','复核疑狱','调齐原卷、验伤与供词；有疑处补查，不先定无罪或有罪。',1,10,0,3,{'public':3,'security':3},['law','care']),
 ('prison','justice','清理淹狱','复核久押案由与办理期限，须补证者另列清单。',1,12,0,4,{'public':4,'corruption':-3},['law','care']),
 ('water','works','修堤疏渠','先勘堤段、核工料与役期，再按工段验收。',1,22,10,5,{'waterRisk':-14,'prosperity':3},['care','growth']),
 ('roads','works','修桥通驿','修治损坏桥段与驿道；通行后便利军运与地方交易。',1,18,6,4,{'prosperity':6,'security':2},['growth','security'])]
events=[]
def event(id,title,dept,rank,brief,reason,evidence,choices,source):
 events.append(dict(id=id,title=title,dept=dept,rank=rank,brief=brief,reason=reason,evidence=evidence,choices=choices,source=source))
def choice(id,label,desc,money,grain,days,tags,effects):return dict(id=id,label=label,description=desc,money=money,grain=grain,days=days,tags=tags,effects=effects)
event('flood','两府大水，请开仓并议蠲免','revenue','灾荒请旨',
 '{region}及邻府多处堤段受损，地方已先发预备仓、安置低洼住户。现报仓粮不足，需跨府调粮，并议受灾田赋蠲缓；两项均超出地方原有额度，请旨。',
 '跨府调粮与税赋蠲免须定中央额度。一般街巷积水已交府县处置，不送御前。',
 ['受灾乡册与堤段勘验已送；受灾户数仍须巡抚与部院复核，不能照报全收。','地方已经先赈，不能让灾民等御批才领第一口粮；续赈与蠲缓另议。'],[
 choice('relief','续赈并蠲缓，另遣员核册','先续粮，减缓灾田征收；户部须另核损册，工部勘堤。',26,50,3,['care','relief','taxRelief'],{'public':8,'waterRisk':-12,'prosperity':2,'authority':1}),
 choice('audit','先续最低口粮，核册后增拨','不中断急赈，但首批规模较小；按核定灾等续议减免。',14,28,4,['care','law','thrift'],{'public':4,'waterRisk':-6,'corruption':-3}),
 choice('delegate','令邻府调济，定额限期回报','先由地方相互调济，中央仅补转运；地方压力较大。',8,16,5,['thrift','delegate'],{'public':1,'waterRisk':-3,'prosperity':-2})], 'ming78')
event('famine','连岁歉收，请赈贷种粮','revenue','粮荒请旨',
 '{region}连季歉收，存粮已难兼顾口粮与来年种子。地方已开仓赈贷，仍请中央续给仓粮、缓征本季田赋，以免春耕再误。',
 '地方仓粮不足且涉及缓征与跨区调拨；寻常粮价波动由府县报部核办。',
 ['先赈名单、仓存与地亩册已分别列出，是否冒领仍须复核。','口粮和种粮不可混作一项，只发口粮可能保住今冬却误了来年。'],[
 choice('relief','赈口粮兼贷种，缓征灾田','救急与春耕一并顾及，短期少收赋税。',20,48,3,['care','taxRelief','growth'],{'public':7,'prosperity':6,'grainLocal':15}),
 choice('loan','赈贷种粮，限额抚恤','优先保住农时，口粮按核册限额接济。',12,30,4,['growth','thrift'],{'public':3,'prosperity':5,'grainLocal':8}),
 choice('market','准平粜转运，官仓限补','由官仓与商运稳价，不许抑买；运到前仍有缺口。',8,18,5,['thrift','growth'],{'public':1,'prosperity':2,'grainLocal':4})], 'ming78')
event('transport','漕粮亏额，涉跨省经手','justice','跨省粮案',
 '漕运交收比原册少一批粮，船户、仓场与经手衙门各持一册，数字不合。军需已暂调补，但亏额及相关责任须跨省勘核，请定查办之法。',
 '军需受影响、跨省经手且涉及官吏责任；一般仓耗先由仓场与户部核销。',
 ['已封存三方原册，差额不等于已查明侵吞，不可先按姓氏或荐引关系定罪。','军需临补已列账；追责与续运分别办理，避免封仓后军中断粮。'],[
 choice('joint','分调原册，交部院会勘','保护经手证人，分别核账；属实再分责，未证者不先下狱。',16,10,4,['law','merit','audit'],{'corruption':-9,'security':3,'authority':2}),
 choice('recover','先补运缺粮，限仓场自核','续运较快，复核独立性稍弱；仍须交出原册。',10,24,3,['security','delegate'],{'corruption':-3,'army':3,'authority':1}),
 choice('suspend','停涉事者经手，另员督运','先撤其经手权，不预断有罪；转交会有短期迟滞。',20,16,5,['law','security'],{'corruption':-6,'authority':1,'prosperity':-2})], 'ming72')
event('border','边镇急报，请定援饷与守备','war','边情急报',
 '北境数处驿路遭袭，守军已就地固守并报损。兵部请调邻镇兵、补军饷与粮运；跨镇调兵不可由一镇擅定，请旨。',
 '跨镇调兵与军需增拨需要中央统筹；零星巡骑与日常验点由边镇自行执行。',
 ['报损与斥候所见分列，尚未据一封急报夸大敌军人数。','邻镇可调兵额与本镇留守数均已呈列，不能抽空原有守备。'],[
 choice('reinforce','补援饷，邻镇协防而不轻进','兼顾粮运与防守，不许各军争功冒进。',30,42,3,['security','care'],{'threat':-14,'army':7,'security':5}),
 choice('fortify','先修守备，核明敌势再议调兵','较省军需，眼前依赖边镇固守。',18,26,4,['security','thrift','law'],{'threat':-7,'army':3,'security':3}),
 choice('envoy','备守并遣使探议','留下守备与最低军需，能否缓和还看邦交。',14,18,5,['thrift','diplomacy'],{'threat':-4,'diplomacy':5,'army':1})], 'ming72')
event('examleak','科场具告受礼，请封卷覆核','justice','科场大案',
 '数名士子具名告发主考收礼，所指礼单已由都察院封存，涉及贡举公信与在职考官。礼部请考试照常、涉者回避，另定覆核之法。',
 '牵涉贡举公信、考官回避与部院会查；普通场务争执由礼部处理。',
 ['具名告发并不等于收礼属实，礼单、送礼记录与口供须互证。','原卷封存，考试不因传闻停废；涉者先回避，不先定罪。'],[
 choice('protect','护告者，命考官回避并交叉复核','明责补证，既护公信也不凭一面之词拿人。',14,0,4,['law','merit','audit'],{'corruption':-7,'literacy':4,'authority':3}),
 choice('ministry','交礼部自核，限期具报','手续较快，但原衙门自核，须留都察院抽验。',8,0,3,['delegate','thrift'],{'corruption':-2,'literacy':2}),
 choice('retest','封涉卷另行覆试，先保其他场次','开支较大，公平重核；不把全场士子当嫌疑人。',22,4,5,['merit','law'],{'corruption':-5,'literacy':6,'authority':2})], 'ming72')
event('trade','邻使请开互市，请定议约范围','rites','邦交请旨',
 '邻使带国书请以马匹易丝，涉及边地关防、验马与市税。鸿胪寺已验身份，礼部请定可议范围，不敢擅许常额与长期税例。',
 '国书往来、长期互市与边防条款须御批；使馆日常供给由有司按例办理。',
 ['国书与名籍可核，马匹仍待验，不能只听使者自报良马。','互市试额与长期常额分列，准议不等于已经签订成约。'],[
 choice('trial','准小额试易，验货后议常额','先试后定，边防与价税由三部会核。',16,6,4,['growth','diplomacy','law'],{'prosperity':5,'diplomacy':7,'army':2}),
 choice('limited','只许边市旧额，不增常例','稳妥守旧，收益较小。',8,0,3,['thrift','security'],{'prosperity':2,'diplomacy':2}),
 choice('delay','回书暂缓，先补关防凭据','不许仓促立约，仍保持来往。',4,0,3,['security','law'],{'diplomacy':-1,'security':3})], 'ming72')
event('deficit','岁计不足，请裁非急用度','revenue','国用请旨',
 '户部核得仓库与本季应付数不足，旧欠已另列；军饷、俸给和在办工程不能同时足额支给，请定先后与暂缓范围。',
 '跨部门预算取舍与既定经费调整须统筹；日常零项报销不逐笔御批。',
 ['现银、应收与旧欠分别列账，未到手收入不算已入库。','内帑与国库分列，不以宫中有银就假定百姓税赋已足。'],[
 choice('austerity','裁缓非急常费，旧欠留账补给','缩减两月非急常费，不收回已用拨款；旧欠仍须用实银支付。',0,0,3,['thrift','care','law'],{'austerity':2,'authority':1}),
 choice('levy','临时加派，明定期限','一次征解银30，先以实银补欠最多8；地方负担加重。',0,0,3,['security','revenue'],{'treasury':30,'repay':8,'public':-6,'prosperity':-3}),
 choice('audit','清解积欠，分期缓支','从待清解税银中收回最多18，实付旧欠最多10；未收到的不算现银。',0,0,5,['law','thrift','audit'],{'recover':18,'repay':10,'corruption':-4,'army':-2})], 'ming78')
event('epidemic','两地时疫，请调医药与赈粮','rites','民生急报',
 '{region}与邻地同报病者增多，医官已先行诊治并分列疑症，地方药材不足；请太医院与户部合调医药、免除灾户急征，需中央续给。',
 '跨区医药调拨、赈粮与征收宽缓需要统筹；寻常零星就医不送御前。',
 ['诊籍按村分列，尚不将所有旧疾都算作同一疫源。','先治病再核销，派医、调药与续粮各记额度。'],[
 choice('full','调医药并续口粮，另验病源','救治与民生并重，短期支出较多。',24,30,3,['care','law'],{'public':7,'healthLocal':14,'prosperity':2}),
 choice('target','按诊籍限拨，重点补疑症药','守住最急缺口，仍须补诊。',14,14,4,['care','thrift'],{'public':4,'healthLocal':8}),
 choice('local','令邻府协医，中央只补药费','地方先办，中央开支较少，恢复较慢。',8,8,5,['delegate','thrift'],{'public':1,'healthLocal':4})], 'ming78')
data={'version':'13.5','departments':[dict(id=i,name=n,scope=s,skill=k,principle=p) for i,n,s,k,p in depts],
 'tasks':[dict(id=i,dept=d,name=n,description=desc,ap=ap,money=m,grain=g,days=days,effects=e,tags=tags) for i,d,n,desc,ap,m,g,days,e,tags in tasks],
 'events':events,'taxes':{'light':{'name':'轻徭薄赋','income':.82,'public':2,'prosperity':2},'normal':{'name':'依额征收','income':1,'public':0,'prosperity':1},'heavy':{'name':'临时加派','income':1.23,'public':-3,'prosperity':-2}},
 'principles':{'care':'恤民','thrift':'节用','merit':'任贤','security':'固边','law':'守法','growth':'通商务农','clan':'护持门第'},
 'sources':[{'id':'game','title':'《皇帝成长计划2》开发者App Store介绍','url':'https://apps.apple.com/cn/app/id1440553367','used':'名臣任用、策略治理、发展国家的经营方向。六部数值与本版流程为原创实现，不声称复刻原作规则。'},
 {'id':'ming72','title':'《明史》卷七十二·职官一','url':'https://zh.wikisource.org/wiki/明史/卷72','used':'六部分职、官员选授考课、国用赋役、军政、刑名与营造分工。'},
 {'id':'ming78','title':'《明史》卷七十八·食货二','url':'https://zh.wikisource.org/wiki/明史/卷78','used':'灾蠲、仓粮赈贷、先赈后闻，以及加派与地方负担的矛盾。'}],
 'note':'晟朝为架空王朝，奏案、人名和数值均为原创虚构。参考明代制度，不把少量资料抽象成跨朝代普遍定律。'}
voices=runpy.run_path(str(P/'frontcourt-dialogue.py'))
data['advice']=voices['ADVICE'];data['bespokeAdvice']=voices['CORE']
(P/'frontcourt-data.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'departments':len(depts),'managementTasks':len(tasks),'majorAffairs':len(events)},ensure_ascii=False))

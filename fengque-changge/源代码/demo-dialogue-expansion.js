'use strict';
// 凤阙长歌 v5：逐 NPC、逐性格、逐心境的长线对话组合引擎。
// 不把固定台词随机洗牌：每次从人物性格、当前心境、关系记忆、生活目标与局势中组装新的回应。
const EXPANSION_CAPACITY = 20480; // 8开场 × 8场景 × 8性格表达 × 8心境语气 × 5收尾
const EXPANSION_STRIDE = 7919;    // 与20480互质，保证一个人物/互动类别内遍历完整组合且不重复
const EXPANSION_OPENERS = {
 '温柔体贴':['他先把手边的事放下，见你进来才露出笑意。','他替你留着一盏温茶，像是早料到你会来。','他把窗边的位置让出来，语气仍轻：“陛下今日得空了？”','他抬眼看你，先问了一句路上冷不冷。','他没有急着行礼，先将案上的杂物收好，免得挡着你坐。','他把准备好的小食往你手边推了推，自己却没先动。','他原本在忙，听见你的声音便停下来，像终于等到一段闲时。','他看见你眉间的倦色，话还没出口，先替你把椅子拉开。'],
 '清冷克制':['他合上手里的文书，动作不急不缓，目光却在你身上停了片刻。','他将案上纸页理齐，才抬眼问你今日为何事而来。','他仍是平日那副沉静模样，只把靠近窗边的座位留给你。','他把未说完的话暂且收住，先向你行礼。','他听见脚步便知道是你，却等你走近才开口。','他用指节轻轻压住纸角，像是在斟酌哪句话该先说。','他替你把茶盏摆正，随后才退回原处。','他抬眼时神情依旧克制，桌边那份新写的笺纸却没有收起来。'],
 '明朗直率':['他远远便看见你，话还没说完，人已经迎到廊下。','他刚练完一套动作，额角还带着汗，见你便笑起来。','他把手里的东西往旁边一放，像是终于等到能说话的人。','他先喊了你一声，随即想起礼数，匆匆补了一礼。','他正和旁人说笑，见你进来便把后半句话留到了以后。','他有些藏不住高兴，连脚步都比平日快了几分。','他把新得的小玩意拿出来，似乎早就想找你分享。','他本想装作镇定，嘴角却先一步泄露了心情。'],
 '骄矜自尊':['他没有立刻起身，只把手边的琴谱或书卷合上，等你先开口。','他抬眼看你，神情里有几分矜持，也有一点没藏好的期待。','他把新作收在一旁，像是不愿显得自己特意等候。','他将衣袖理好，才慢慢向你行礼。','他听见你来，先把正在做的事做到收尾，不肯显得匆忙。','他把座位留在身侧，却偏偏不提是为你准备的。','他看似漫不经心地拨弄着手边物件，目光却一直留意门口。','他先问你今日是否还有旁事，语气听着平淡，指尖却停住了。'],
 '敏感多思':['他像是有话想说，见你进来又先确认了一遍你的神色。','他把写了一半的信笺压在书下，轻声问你今日忙不忙。','他望向门外片刻，像是把某个念头重新咽了回去。','他替你倒茶时动作很慢，似乎想多留一点说话的时间。','他先问你有没有用过饭，之后才提自己的事。','他听见你的声音才从思绪里回神，眼底还留着未散的忧虑。','他把准备好的话在心里过了一遍，最后只说了句“你来了”。','他看着你坐定，才像终于有了开口的勇气。'],
 '圆融世故':['他先把旁人的话题妥帖收住，再笑着请你入座。','他替你留了不显眼却最舒服的位置，连茶水温度都恰好。','他将桌上的账册合起，笑道今日先不拿数字烦你。','他见你进来，先问外头可有人需要他回话。','他与人说话向来留三分，此刻却把旁人都请了出去。','他把一封家信压在砚台旁，转头便换上轻松神色。','他斟茶时顺口提起一件市井趣闻，像是特意挑来让你放松。','他先看你神色，再决定今日是讲笑话还是讲正事。'],
 '严正守礼':['他依礼起身相迎，确认你坐稳后才开始说话。','他将手边典籍放回原处，衣冠一丝不乱。','他先向你行礼，随后才问今日是否有政务要议。','他把窗扇合上一半，免得风直吹到你身上。','他看见你来，先把案上不合礼制的杂物收妥。','他将茶盏放在你惯用的一侧，才退回席间。','他没有多作寒暄，只问你今日是否按时用膳。','他抬眼时仍端正持重，声音却比在朝堂上缓和。'],
 '野心进取':['他刚写完一份章程，见你进来便把最要紧的一页递上。','他将练习用的器具收好，像是随时准备接下新的差事。','他本在与人讨论事务，听见你来便把争论留到之后。','他抬眼时神采很足，显然今日又有了新的打算。','他把一份尚未呈上的计划摊开，想听听你的意见。','他将袖口束紧，像是刚从忙碌中抽身。','他见你来，先汇报一件办成的小事，再问你是否还有吩咐。','他把手里的笔停住，神情里写着“今日也想做出些成绩”。'],
 '疏朗洒脱':['他推开半扇窗，让庭院里的风先替你解一解闷。','他刚从外头回来，衣角还沾着一点路上的尘土。','他把手里的东西往桌上一放，笑着让你先坐。','他正望着院中树影出神，听见你来才回过头。','他把一包路上买来的小食放在桌上，像是随手带回。','他今日没有急着谈正事，只问你想不想出去走走。','他把椅子往外挪了挪，给你留出看庭院的角度。','他笑着招呼你，像是见到旧友而非等候一道旨意。'],
 '务实重利':['他先把账册合上，确认手边没有急需处理的事。','他将算盘推到一旁，顺手把茶水和点心算作今日招待。','他看见你来，先问这趟是否为公事，免得耽误正务。','他把手里那张清单折好，才抬头与你说话。','他刚核完一笔开支，眉间的认真还没完全散去。','他把一份算到一半的账留在原处，准备稍后接着算。','他先看了眼时辰，随后给你倒了茶。','他把桌边空出来，像是今日愿意把时间算给你。'],
 '寡言重诺':['他听见你来便起身，没有多话，只把位置留好。','他将要交付的东西放到案边，等你亲自查看。','他把门边的风灯拨亮，随后才回到你面前。','他点头向你问安，目光落在你身上，确认你无恙。','他把手里的活计做完最后一步，才来与你说话。','他将一件修好的小物放在桌上，没有解释为何特意收着。','他站得离你不远不近，像在等你先说今日想谈什么。','他把外袍挂好，安静地坐到你对面。'],
 '戒备善谋':['他先留意门外动静，确认无人靠近才转向你。','他将一封密信收进袖中，语气仍像平常闲谈。','他没有立刻回答，只观察你今日的神色。','他把门掩好，随后才将真正想说的话放到桌面。','他指尖轻敲桌沿，像在衡量这场谈话能走到哪一步。','他先问你是否独自前来，再请你坐下。','他把几份纸页交叠收齐，留下一张与你有关的记事。','他笑意不深，却把你惯用的茶盏放到了近处。']
};
const EXPANSION_BEATS = {
 '温柔体贴':['我不是要您立刻答应，只盼您知道，我说这些是认真的。','您若觉得累，便不必急着回应，我愿意多等一会儿。','我记得您随口提过的小事，不是为了讨赏，只是觉得该记着。','有些话说出来便轻松些，您不必替我把每个字都安置妥当。','我希望您在这里能松一口气，不必时时想着下一道旨意。','若我能替您分担一点，今日这趟便没有白等。','您不必总顾及我，我也想知道您真正想要什么。','我愿意把话说得再明白些，免得您又独自猜。'],
 '清冷克制':['话说到这里便够了，余下的事我会自己理清。','我并非没有情绪，只是不习惯把每一分都摆在明面上。','您若要一个确切答复，我可以给；若只想听顺耳的话，我不会说。','我记得这件事，也记得您当时没有敷衍我。','分寸并非疏远，只是我不愿让一时心意误了长久相处。','我可以退一步，但不想让彼此都装作什么也没发生。','有些旧事我仍记得，只是不急着拿出来作证。','我愿意听您说完，再决定该怎样回应。'],
 '明朗直率':['我话直，若说得不好听，您也别只记前半句。','我不擅长拐弯，想见您便来了，高兴也就笑出来。','这件事我有自己的主意，您不同意也请听我讲完。','今日我没有别的打算，就是想和您多待一会儿。','我答应的事就会去做，办不到也会提前告诉您。','您不必猜我是不是生气，我若不高兴会直接讲。','我想赢，也不怕输；只盼您别拿客套话哄我。','既然见面了，就别只谈一半，咱们把话说清楚。'],
 '骄矜自尊':['我不求旁人点头，只希望您别把我的认真当作理所当然。','我有自己的喜恶，也有不愿退让的地方。','您若欣赏我，请欣赏我本来的样子，不必替我改得圆滑。','我可以接受拒绝，却不愿接受敷衍。','我并非非要争个高下，只是不想被当作可有可无。','若这句话只是一时兴起，我宁可您不要说。','我愿意把新作给您看，是因为您的评价对我确实重要。','我可以先低头，但不能每回都由我先低头。'],
 '敏感多思':['我方才想了许久，还是觉得亲口说给您听更妥当。','我知道自己想得多，可有些细节确实会让我记很久。','您若能给我一个准信，我便不必反复猜测。','我不是想让您为难，只是不愿把心事一直藏着。','我会把今日的话记下来，等哪天想明白了再告诉您。','我怕自己会错意，所以想再问一遍。','我愿意相信您，只是需要一点时间把那份不安放下。','您肯听我说完，我就已经安心了许多。'],
 '圆融世故':['各方情面可以慢慢周全，眼前这句我不想再绕弯子。','场面话我会说，真心话却不想拿来应付您。','我见过许多承诺，真正值钱的是后来有没有做到。','您给我留余地，我也会替您把旁人的话挡一挡。','我不急着站队，但也不会把自己的立场卖给谁。','这笔人情我记得，往后总有机会还。','有些事表面看着圆满，里头的账却得另算。','您若问我真话，我便不拿好听话搪塞。'],
 '严正守礼':['礼数可以周全，心意却不能只照着章程写。','有错我会认，无过也请容我把理由说清楚。','规矩的本意是让人安稳，不是让人无处说话。','我愿意守约，也希望约定不是单方面的。','在其位便担其责，这一点我不会推给旁人。','您可以不同意我的做法，但请别疑我的本意。','该说的话我会直言，哪怕此刻听来不够顺耳。','我不怕担责，只怕事情最后变成互相推诿。'],
 '野心进取':['我想把事情做成，也想让您看见我不是只会说。','给我一个能担事的位置，我会拿结果回来。','我不满足于被夸一句聪明，更想知道自己能走多远。','眼前这一步若走稳，后面才有资格谈更大的事。','我愿意承担代价，但希望目标不是空话。','若您信我，就让我亲手把这份章程落到实处。','我知道自己有野心，也知道野心要靠本事支撑。','我可以等机会，但不会把一生都用来等。'],
 '疏朗洒脱':['话说出来便轻松了，您不必急着给我一个答案。','我喜欢有趣的日子，也喜欢能坦白说话的人。','若今日不成，改日再试便是，不必把一回得失看得太重。','路上有好景，我总想找个人讲一讲。','我不愿被一纸安排困住，也不想困住旁人。','您若想走走，我知道一条少有人去的小路。','有些事认真便好，不必时时摆出沉重模样。','我会记得今日的好，也不拿它逼您许诺。'],
 '务实重利':['这话没有多余意思，您听完再决定值不值得。','我愿意付出，但总得知道这份付出落在何处。','账目可以算清，人情也可以记在心里。','我不怕谈条件，怕的是条件临时变了却无人认账。','日子要过得长久，不能只靠一时高兴。','若有约定，最好把时间和做法都说具体。','我希望自己有用，也希望自己的辛苦被看见。','这件事若能做成，咱们两边都不算吃亏。'],
 '寡言重诺':['不必当场应我，答应过的事我会记着。','我说得少，不代表我没有放在心上。','能做的我会去做，不能做的也不会拿话哄您。','今日这一步我先办妥，旁的话以后再讲。','您若需要我，留一句准话便好。','我不擅长说漂亮话，但不会让您白等。','这份心意我收下了，往后会给您一个交代。','我记得谁在难处时帮过我，也记得谁没有。'],
 '戒备善谋':['我今日肯说到这里，是因为还愿意信您几分。','有些话不是不能讲，只是要先知道会落到谁耳中。','我可以告诉您我知道的部分，未知的不会拿来填空。','您若想让我放下戒心，最好先把事情说清楚。','我习惯留一条退路，但不代表我从未认真靠近。','这件事我会继续查，只是不想让无辜的人跟着受牵连。','您问得太急，我反而不知道该从哪一句答起。','我不求您全信我，只盼您先听完证据。']
};
const EXPANSION_ENDINGS = {
 '温柔体贴':['他说完便把茶盏推近了些，没有催你表态。','他收住话头，仍留在原处陪你坐着。','他说完看了看你，像是确认这番话没有让你更累。','他没有再追问，只把那份小心意放在桌边。','这一回他没有把话说尽，留给你一个从容回应的空当。'],
 '清冷克制':['他把余下的话收回，仍替你留着那盏温茶。','话音落下，他重新理好纸页，没有催你回答。','他向你点头，神色恢复平静，眼底却没完全放下。','他不再多说，只等你给出明确的意思。','他将窗扇轻轻合上，谈话便停在这里。'],
 '明朗直率':['他说完便笑了，像是终于把憋了一阵的话讲出来。','他挠挠头，仍等着你给个痛快答复。','他没再装作若无其事，神情坦荡得很。','他把话说完，转头又提起方才没讲完的趣事。','他看着你，眼神亮得像校场上刚升起的日头。'],
 '骄矜自尊':['他将目光移开，仍不肯显出太多期待。','他说完便收起那页曲谱，等你自己决定要不要再问。','他端起茶盏，仿佛这只是寻常一谈。','他没有催促，只把自己的立场清楚留在桌面上。','他轻轻抬了抬下巴，仍保留着自己的骄傲。'],
 '敏感多思':['他说完便停下来，像是在等你有没有听懂话里的真正意思。','他低头抚平纸角，似乎终于不必把这句话憋在心里。','他没有追问，只希望你不要把这段话当作随口一说。','他看着你，神色仍有些不安，却比方才坦然。','他把那封信收好，像将这一刻也认真记了下来。'],
 '圆融世故':['他把话题轻轻收住，仍给彼此留了转圜的余地。','他笑着替你续茶，像是刚才那番真话并未破坏气氛。','他没有急着讨答案，先把旁的琐事安排妥当。','他说完便把账册收起，今日这一页暂且翻过。','他看着你，等你愿意把场面话换成真心话。'],
 '严正守礼':['他行了一礼，谈话到此仍留有清楚的分寸。','他把书卷放回原处，等候你作最后决定。','他没有再作辩解，只把该承担的责任记在心里。','他说完便静候，不拿沉默逼你答复。','他将衣袖理正，神情仍端肃，语气却缓和不少。'],
 '野心进取':['他把写好的章程推到你面前，等你看下一步。','他没有停在口头承诺上，转身便准备去做。','他看向你，像已在心里列好了下一份计划。','他说完仍精神十足，仿佛这番谈话给了他新的劲头。','他收起纸页，准备拿实际结果来回答。'],
 '疏朗洒脱':['他把窗推开些，庭院里的风便把话尾带远了。','他说完便笑，像是终于把一件小事放下。','他不再拘着话题，顺手问你要不要出去走走。','他把点心分了一半给你，气氛又轻快起来。','他站起身活动了下肩，像要把这半日过得自在些。'],
 '务实重利':['他把刚才的话记进心里，随后将账目重新摊开。','他没有急着追加条件，只等你把态度说清楚。','他将茶盏放回原处，像是把这次相处也认真算了一笔。','他说完便问起时辰，准备把该办的事接着办完。','他留下一份清单，告诉你哪些事可以马上落地。'],
 '寡言重诺':['他点点头，没有多说，转身便去做该做的事。','他说完把小物收好，像是已经有了答案。','他安静地陪你坐了一会儿，没有催你离开。','他将门边的灯拨亮，留下一句“路上慢些”。','他起身相送，仍旧话少，却没有半点怠慢。'],
 '戒备善谋':['他把门重新掩好，像是把这番话也收进了暗处。','他说完仍留意着外头动静，没有急着交出全部底牌。','他将密报收回袖中，等你决定下一步如何查证。','他看着你，直到确认你没有追问才略微放松。','他没有多作保证，只说会把能查清的部分查清。']
};
const EXPANSION_MOOD_LINES = {
 '平静':['他此刻神色平和，愿意把一件小事从头讲起。','语气不急不缓，像是终于有了可以安静说话的时辰。','他没有刻意讨好，也没有藏起自己的真实想法。','这份平静并非无话可说，只是他愿意按自己的节奏来。','他今日不急着争辩，先把事情讲清楚。','他把情绪放在一旁，认真回应你的问题。','比起求一个立刻的结果，他更愿意把话说完整。','他愿意留在这里，把这段时间过得寻常些。'],
 '期待':['他话里多了一点盼头，像是早已想过你会怎样回答。','他不时看向你，似乎在等一个明确的约定。','他把今日的闲时看得很重，连语气都比平时轻快。','他愿意谈起下回见面的打算，却不敢先替你作主。','他把一件小事说得格外仔细，像盼你也记住。','他没有掩饰期待，只把它放在一句寻常问候里。','他今日像是有好消息要分享，眼神比平日亮些。','他希望这次相处不要太快结束。'],
 '热恋':['他看你的眼神比平日柔软，连寻常话也像多了一层意思。','他今日愿意主动说起想念，不再把每个字都藏起来。','他把你随口提过的事记得很清楚，像一直放在心上。','他不急着谈旁人，只想知道你这几日过得如何。','他对你的回应格外认真，连沉默也不显得生分。','他把靠近你的心意写在动作里，却仍等你先决定。','他偶尔露出一点笑，像只在你面前才有的松弛。','他愿意把未说完的心事交给你听。'],
 '安心':['他不像从前那样反复试探，终于肯说些不必防备的话。','他今日不担心你会误解，语气自然了许多。','他把一些日常琐事告诉你，像把生活也分出一角。','他相信你会听完，所以不急着替自己辩解。','他愿意承认疲惫，也愿意接受你的关心。','他不再把每一次相见都当作需要证明的事。','他今日说话时肩背放松，像终于能歇一歇。','他把你当作可以商量的人，而不只是发号施令的君主。'],
 '吃醋':['他把旁人的名字绕开了些，话里仍藏着一点在意。','他努力装作不在乎，提到你的日程时却问得格外仔细。','他没有责怪谁，只想知道自己在你心里还有没有位置。','他把准备好的话收回一半，等你主动问起。','他仍照常行礼，只是比平日更希望你多留片刻。','他把失落藏进玩笑里，笑意却没有完全到眼底。','他不想拿旁人作比较，只盼你把他的心意也放在心上。','他今天格外敏锐，连你一句随口的话也听得认真。'],
 '失望':['他不愿再把期待说得太满，语气也比平日客气。','他记得之前的约定，只是不确定这回还该不该等。','他没有发脾气，却把原本想分享的事收了回去。','他想听你解释，但不愿替你先找借口。','他把话说得简短，像是怕自己又期待过头。','他仍愿相见，只是想先确认你是否把这件事放在心上。','他不再追问何时再来，转而谈起手头的正事。','他把失落压得很稳，却希望你能看见。'],
 '委屈':['他有些话憋了许久，今日终于愿意说给你听。','他没有大声抱怨，只把自己在意的那一点讲清楚。','他怕你觉得麻烦，开口前仍先问你有没有时间。','他想要的不是补偿，而是你承认那件事确实让他难受。','他把情绪收得很小，仍没能完全藏住眼底的酸涩。','他希望你先听完，不要立刻替旁人解释。','他不是要你事事偏袒，只希望自己也被公平对待。','他把那句没说出口的话留了许久，今日不想再咽回去。'],
 '戒备':['他只说自己愿意公开的部分，私事仍留着边界。','他在回答前停了一停，确认你不是来追问秘密。','他今日不想把所有心思交出来，但也没有拒绝交谈。','他更在意你如何回应边界，而不是你问得有多深。','他把话说得谨慎，仍留下继续相处的可能。','他先讲事实，再看你是否愿意尊重他的顾虑。','他没有完全放下防备，却愿意让你知道一点真实想法。','他不想被逼着表态，所以把决定留到更合适的时候。'],
 '恼怒':['他仍愿意说话，但此刻不打算把不满轻轻带过。','他的语气比平时冷，话里有明确的界限。','他希望你先听清事情经过，不要急着替任何人定论。','他并非要与你争胜，只是不愿再被当作理所当然。','他把愤怒压在礼数之下，却没有假装没发生。','他愿意说明原因，但不会立刻接受一句敷衍的安抚。','他今日需要的是解释与尊重，而不是赏赐。','他把话说得直接，免得彼此继续误会。'],
 '疏离':['他依旧把公事说清，私下心事却暂时不愿多谈。','他保持着礼貌的距离，不再主动延长相处。','他没有拒绝你，只是需要时间确认自己还愿不愿靠近。','他把话题停在安全处，不想勉强自己流露情绪。','他不再主动提起旧约，等你先拿出实际行动。','他今日更愿意独处，能说到这里已是难得。','他把每个字都说得平稳，像在重新整理彼此的位置。','他仍会回应你，却不再把所有期待交出来。']
};
const EXPANSION_PLAYER_PROMPTS = {
 chat:['你问起他近日的日常，他想了想，决定从一件小事说起。','你没有谈政务，只问他最近有没有遇见什么新鲜事。','你问他故乡与旧友，他挑了一段最想念的记忆讲给你听。','你问他闲暇时真正喜欢做什么，而不是平日该做什么。','你把话题放得轻些，想听听他不在朝堂时的模样。','你问他近来最挂心的一件事，他没有只谈公事。','你问起他最近的一餐、一场雨或一段路，话便慢慢多了。','你请他不必拘礼，只谈一件今日想说的小事。'],
 care:['你看出他有些疲惫，先问他是否愿意歇一会儿。','你没有急着劝他，只问他愿不愿意把烦心事说出来。','你问他近来睡得如何，是否总把自己排在事情之后。','你把茶盏递过去，问他有没有好好照顾自己。','你留意到他神色不如往常，便把旁人先请了出去。','你问他今日有没有什么需要，不必事事自己承担。','你没有拿赏赐作安慰，只想听他把话说完。','你问他最近是否受了委屈，愿不愿意让你知道。'],
 activity:['你邀他一起做一件平常的小事，不必把每一刻都过成任务。','你问他想下棋、散步、听曲，还是做一件他真正喜欢的事。','你把今日的时辰留出来，请他选一个舒服的去处。','你们一起做起手边的事，话题也从正经慢慢转向日常。','你提出一场不计输赢的比试，让他不必时时顾虑身份。','你问他是否愿意出门走走，看看宫墙外的春色。','你说今日不谈政务，只想与他安静待一会儿。','你把选择交给他，想知道他会把这段时间安排成什么样。'],
 flirt:['你把话说得认真些，想知道他是否也把这段相处放在心上。','你试着表达欣赏，没有用玩笑把心意藏起来。','你问他有没有想过，若不论君臣身份会怎样看待你。','你说起一件让你想起他的事，随后等他回应。','你没有逼他给承诺，只把自己的心意坦然放在眼前。','你轻声问他，是否也曾在不经意时想起你。','你把一句赞许说得具体，愿意承担它带来的后果。','你问他愿不愿意让这份关系向前一步。'],
 persuade:['你请他支持一项安排，也把可能承担的代价说清楚。','你与他商量一件差事，先听他真正担心的是什么。','你没有直接下旨，而是问他愿不愿意共同承担。','你把两种方案摆出来，请他指出最难落地的地方。','你希望争取他的支持，但不打算用情分代替理由。','你让他谈谈此事对自己和旁人的影响。','你问他有没有更稳妥的办法，愿意听不同意见。','你请他把顾虑说在前面，免得日后彼此为难。'],
 probe:['你问他对一件传闻知道多少，并说明未经核实的话不必勉强作答。','你试着问起他真正担心的事，不要求他透露不愿公开的秘密。','你问他对某位同僚的看法，也请他区分亲眼所见与听闻。','你想知道他对自己的真实评价，而不是只听场面话。','你请他把立场说清楚，不必为了讨好你而改口。','你问他是否有事瞒着你，并给他保留沉默的余地。','你把疑点逐一说出，请他从自己的角度解释。','你想听他如何判断眼下局势，而非只给你一个结论。'],
 scold:['你指出一处具体过失，也让他有机会解释缘由。','你没有绕开问题，直说这件事已经影响到旁人。','你要求他承担责任，但不打算把未经查证的罪名扣给他。','你把规矩与情分分开讲，希望他明白你为何生气。','你请他先听完你的批评，再说自己的理由。','你指出他越过了边界，也愿意听他为何如此决定。','你要求他说明事实，而不是用忠心或委屈作答。','你把话说重了些，随后仍留出解释的时间。'],
 sleep:['你先问他今夜是否愿意留下，也明确告诉他可以拒绝。','你把选择交给他，不让身份或情分替他作答。','你问他是否愿意在这里歇一夜，若不舒服便改日。','你先确认他今日心情如何，再问是否愿意留下相伴。','你告诉他不必顾虑礼数，自己的意愿最要紧。','你把灯调暗些，随后认真等他回答。','你问他想不想留下说会儿话，未必一定要共度长夜。','你让他知道，无论答应与否，明日都仍可好好相处。']
};
const EXPANSION_MOOD_PROMPT = {
 '平静':'他今日心境平和，愿意把话说得完整。','期待':'他心里有所盼望，回答时不时看向你。','热恋':'他对你格外在意，许多寻常话都带着柔软。','安心':'他不必再反复试探，愿意说些日常琐事。','吃醋':'他在意你的安排，却不想把情绪变成对旁人的指责。','失望':'他不再把期待说得太满，希望先看见实际行动。','委屈':'他有一处心伤尚未放下，盼你听见事情的另一面。','戒备':'他仍保留边界，只愿分享自己能够承担的部分。','恼怒':'他此刻需要解释与尊重，不愿被一句安抚带过。','疏离':'他把距离留着，仍愿把公事与必要的话说清楚。'
};
function expansionStyle(p){return p.type||p.personality||'温柔体贴';}
function expansionHash(s){let n=2166136261;for(const c of String(s)){n^=c.charCodeAt(0);n=Math.imul(n,16777619);}return n>>>0;}
function expansionScenes(p,category,topic){
 const r=state.relations[p.id]||{},m=r.mind||{},pr=MIND_PROFILE[p.id]||{},w=state.world||{},f=state.factions||{};
 const memory=m.memories?.length?m.memories[m.memories.length-1].text:'前些日子的一段相处还留在心里';
 const goal=pr.independentGoal||pr.goal||p.desc||'把手边的日子过好';
 const where=typeof p.location==='string'?p.location:(p.home||p.birthplace||'京城');
 const event=w.lastEvent||'宫外今日无大风波';
 const topicText=String(topic||category||'闲谈').replace(/^exclusive:/,'');
 const world=state.world?('边仓余粮'+w.grain+'，边境威胁'+w.threat+'，朝臣争执'+(f.tension??0)):'朝局暂且平稳';
 return [
  '今日在'+where+'附近走动时，他又想起了'+goal+'。',
  '作为'+(p.role||'宫中一员')+'，他近日仍要应付不少琐事，却没有把自己的打算全都放下。',
  '宫外传来的消息是“'+event+'”。他没有只顾着自己的处境，也在想这件事会落到谁身上。',
  '眼下'+world+'。他把这些变化记在心里，却没有急着替你作决定。',
  '他记得最近一次相处时你说过的话：“'+memory+'”。这回他想把后半句也说出来。',
  '你们谈到“'+topicText+'”，他没有立刻给出最容易听的答案，而是先想了想自己的真实感受。',
  '近来他最想完成的事，是'+goal+'。这件事与宫中差事并不完全相同，却同样重要。',
  '他看了一眼案头的日程，发现今日竟有一段空闲，于是决定不把这场谈话匆匆结束。'
 ];
}
function expansionBaseLine(p,category,topic,idx){
 const cat=FICTION_DATA.categoryKeys.indexOf(category),pi=MIND_VOICE[expansionStyle(p)]??0,mi=FICTION_DATA.states.findIndex(s=>s.name===currentMind(p));
 const t=topic==='stay'?'ask':topic;
 const candidates=FICTION_INDEX.get(cat+'|'+pi+'|'+mi+'|'+t)||[];
 if(candidates.length)return candidates[idx%candidates.length];
 const row=revisionRow(p,category);
 return row?['REV',-1,cat,mi,row.stage,row.reply]:null;
}
function composeExpandedDialogue(p,cursorKey,category,topic,baseText,playerText){
 ensureMinds();const r=state.relations[p.id],m=r.mind;m.dialogueCursor=m.dialogueCursor||{};m.dialogueCycle=m.dialogueCycle||{};
 let cursor=Number(m.dialogueCursor[cursorKey]||0),cycle=Number(m.dialogueCycle[cursorKey]||0);
 if(cursor>=EXPANSION_CAPACITY){cursor=0;cycle++;m.dialogueCycle[cursorKey]=cycle;}
 const start=expansionHash(p.id+'|'+cursorKey+'|'+cycle)%EXPANSION_CAPACITY;
 const ix=(start+cursor*EXPANSION_STRIDE)%EXPANSION_CAPACITY;
 m.dialogueCursor[cursorKey]=cursor+1;
 const closeIndex=ix%5,moodIndex=Math.floor(ix/5)%8,beatIndex=Math.floor(ix/40)%8,sceneIndex=Math.floor(ix/320)%8,openIndex=Math.floor(ix/2560)%8;
 const style=expansionStyle(p),mood=currentMind(p),openers=EXPANSION_OPENERS[style]||EXPANSION_OPENERS['温柔体贴'];
 const beats=EXPANSION_BEATS[style]||EXPANSION_BEATS['温柔体贴'],ends=EXPANSION_ENDINGS[style]||EXPANSION_ENDINGS['温柔体贴'];
 const moodLines=EXPANSION_MOOD_LINES[mood]||EXPANSION_MOOD_LINES['平静'];
 const scenes=expansionScenes(p,category,topic);
 const source=expansionBaseLine(p,category,topic,ix);
 const sourceStage=source&&source[4]&&source[4]!=='REV'?source[4]:'';
 const sourceReply=((source&&source[1]>=0&&source[5])||baseText||revisionRow(p,category)?.reply)||'他把话想了片刻，终于决定把真实想法说给你听。';
 const moodLine=moodLines[moodIndex];
 const stage=openers[openIndex]+'\n\n'+scenes[sceneIndex]+(sourceStage?'\n\n'+sourceStage:'');
 const reply=sourceReply+' '+beats[beatIndex]+' '+moodLine+' '+ends[closeIndex];
 const location=(source&&source[1]>=0?FICTION_DATA.scenes[source[1]]?.location:null)||p.location||'宫中';
 const result={id:'DX-'+p.id+'-'+cursorKey+'-'+cycle+'-'+cursor,stage,reply,scene:{player:playerText||EXPANSION_PLAYER_PROMPTS[category]?.[ix%8]||'你请他把心里话说清楚。',location},mood,variant:cursor,capacity:EXPANSION_CAPACITY};
 m.lastGeneratedDialogue=result;
 return result;
}
const expansionReadBefore=readFiction;
readFiction=function(p,category,topic){
 if(!p||!state.relations[p.id]||!['chat','care','activity','flirt','persuade','probe','scold','sleep'].includes(category))return expansionReadBefore?expansionReadBefore(p,category,topic):null;
 const original=expansionReadBefore?expansionReadBefore(p,category,topic):null;
 return composeExpandedDialogue(p,category,category,topic,original?.reply,EXPANSION_PLAYER_PROMPTS[category]?.[expansionHash(p.id+'|'+topic+'|'+currentMind(p))%8]);
};
const expansionVisitBefore=visit;
visit=function(id){expansionVisitBefore(id);const p=PEOPLE.find(x=>x.id===id);if(!p||!session||session.id!==id)return;const d=readFiction(p,'chat','recent');if(d){session.message=d.stage+'\n\n你问：“'+d.scene.player+'”\n\n“'+d.reply+'”';session.response='';renderSession();save();}};
const expansionInteractionTopicBefore=interactionTopic;
interactionTopic=function(id){
 const p=session&&PEOPLE.find(x=>x.id===session.id),section=session?.section,historyBefore=session?.history?.length||0;
 const cursorBefore=p&&section?Number(state.relations[p.id]?.mind?.dialogueCursor?.[section]||0):0;
 expansionInteractionTopicBefore(id);
 if(!p||!session||session.id!==p.id||(session.history?.length||0)<=historyBefore||section==='sleep')return;
 let d=state.relations[p.id]?.mind?.lastGeneratedDialogue;
 const cursorAfter=Number(state.relations[p.id]?.mind?.dialogueCursor?.[section]||0);
 if(cursorAfter===cursorBefore){const row=revisionRow(p,section);d=composeExpandedDialogue(p,section,section,id,row?.reply||null,EXPANSION_PLAYER_PROMPTS[section]?.[expansionHash(p.id+'|'+id+'|'+currentMind(p))%8]);}
 if(!d)return;
 session.response='<span class="mind-stage">'+mindEscape(d.stage)+'</span><br>你问：“'+mindEscape(d.scene.player)+'”<br><br>“'+mindEscape(d.reply)+'”';
 if(state.logs?.length)state.logs[state.logs.length-1].text=p.name+'：'+d.reply;
 renderSession();save();
};
actions.interactionTopic=interactionTopic;
const expansionRecruitBefore=openRecruit;
openRecruit=function(p){expansionRecruitBefore(p);const d=composeExpandedDialogue(p,'recruit','persuade','recruit',null,'你向他说明宫中安排，也认真询问本人是否愿意。');const box=$('modalBody')?.querySelector('.scene-text');if(box)box.textContent=d.stage+'\n\n“'+d.reply+'”';save();};
function expansionAuditionBase(p,index){
 const pr=MIND_PROFILE[p.id]||{},cp=typeof castProfile==='function'?castProfile(p.id):null;
 const specialty=cp?.specialty||p.specialty||'读书习字';
 const interests=Array.isArray(cp?.interests)?cp.interests.join('、'):'';
 const r=state.relations[p.id],m=r.mind,mode=currentMind(p);
 if(index===0)return '我来应选，并非只听家中安排。'+(pr.goal?'我眼下最想要的是：'+pr.goal+'。':'')+(pr.independentGoal?'若能入宫，也想继续做成这件事：'+pr.independentGoal+'。':'')+'至于往后如何，我想先凭自己的意愿走一步。';
 if(index===1)return '平日我最熟的是'+specialty+'。'+(interests?'除此之外，也会做些'+interests+'。':'')+'闲时并不总在等召见，我也有自己的朋友、旧事和想学的东西。';
 if(['恼怒','疏离','失望'].includes(mode))return '陛下若问我是否愿意今日便留下，我想先说不。不是要冒犯您，只是我还有些顾虑未能放下。若日后有机会再谈，我会自己来答复。';
 if(mode==='戒备'&&r.trust<40)return '我听说了宫中的安排，但现在还不能轻易应承。若陛下愿意让我先看清日后的生活、保留与家中通信的余地，我再认真考虑。';
 if(mode==='委屈')return '我愿意留下，但有件事想先说明：我不希望自己的心意总被拿来与旁人比较。若能被平等相待，我愿意试着相信这段缘分。';
 if(mode==='吃醋')return '我知道宫里不会只有一人。若陛下愿意把相处的日子说清楚，不以许诺哄我，我愿意留下；但我不想靠争抢得到位置。';
 return '我知道宫中有规矩，也知道陛下还有许多要紧事。若这份邀请出自真心，我愿意留下试着相处；若只是权宜安排，也请直说，我可以自己作决定。';
}
function expansionAuditionLine(p,index){
 const key='audition_'+index,base=expansionAuditionBase(p,index);
 const prompt=['你问他为何愿意来到殿前应选。','你问他平日最喜欢做什么，宫外还有哪些牵挂。','你把入宫后的安排与可能的委屈都说清楚，再问他愿不愿意留下。'][index];
 return composeExpandedDialogue(p,key,'audition',String(index),base,prompt);
}
const expansionAuditionInterviewBefore=auditionInterview;
auditionInterview=function(id,answer=''){
 const p=PEOPLE.find(x=>x.id===id),au=state.audition;
 if(!p||!au?.pool?.includes(id)){return expansionAuditionInterviewBefore(id,answer);}
 const greeting=answer||composeExpandedDialogue(p,'audition_intro','audition','intro','我已将自己的来意想清楚，愿先听陛下问话。','你请他不必紧张，先说说今日为何前来。').reply;
 expansionAuditionInterviewBefore(id,greeting);
 if($('modalEyebrow'))$('modalEyebrow').textContent='选秀问话 · '+currentMind(p)+' · '+p.type;
 const btn=$('modalBody')?.querySelector('[data-action="auditionSelect"]');
 if(btn&&au.consent?.[id]===false){btn.disabled=true;btn.querySelector('small')?.replaceChildren(document.createTextNode('本人已表示暂不愿留宫。尊重其意愿，可日后再问。'));}
 save();
};
function expansionAuditionAsk(raw){
 const parts=String(raw).split('|'),id=parts[0],index=Number(parts[1]),au=state.audition,p=PEOPLE.find(x=>x.id===id);
 if(!au||au.status!=='offered'||!au.pool?.includes(id)||!p||![0,1,2].includes(index))return;
 au.interviews=au.interviews||{};au.consent=au.consent||{};au.interviews[id]=au.interviews[id]||[];
 if(au.interviews[id].includes(index))return;
 au.interviews[id].push(index);
 if(index===2){const mood=currentMind(p),r=state.relations[id];au.consent[id]=!['恼怒','疏离','失望'].includes(mood)&&!(mood==='戒备'&&r.trust<40);}
 const d=expansionAuditionLine(p,index);
 if(index===2&&!au.consent[id])d.reply+='\n\n这不是永远的拒绝，只是今日还不愿留牌。等我把心事理清，若仍愿意，会亲自再来。';
 if(index===2&&au.consent[id])d.reply+='\n\n我愿意留下，但请记住，这是我自己作出的决定。';
 state.relations[id].mind.security=clamp(state.relations[id].mind.security+(index===2&&au.consent[id]?3:1));
 rememberMind(id,'在选秀问话中，女帝问及'+['应选缘由','日常喜好','入宫意愿'][index]+'。'+(index===2?(au.consent[id]?'本人愿意留牌。':'本人今日暂不愿留牌。'):'对方愿意认真作答。'),'选秀问话');
 log(p.name+'：'+d.reply,'选秀',id);
 auditionInterview(id,d.reply);
 save();
}
actions.auditionAsk=expansionAuditionAsk;
actions.auditionInterview=id=>auditionInterview(id);
const expansionAuditionPanelBefore=auditionPanel;
auditionPanel=function(){expansionAuditionPanelBefore();const au=state.audition;if(!au||au.status!=='offered'||!$('modalBody'))return;const buttons=$('modalBody').querySelectorAll('.audition-grid [data-action="auditionInterview"]');buttons.forEach(btn=>{const id=btn.dataset.id,p=PEOPLE.find(x=>x.id===id);if(!p)return;const host=btn.parentElement;if(host&&!host.querySelector('.dialogue-mood')){const chip=document.createElement('p');chip.className='mini dialogue-mood';chip.textContent='此刻心境：'+currentMind(p)+' · '+p.type+' · 近况会影响当场回答';btn.before(chip);}});};
const expansionAuditionSelectBefore=actions.auditionSelect;
actions.auditionSelect=id=>{const au=state.audition;if(au?.consent?.[id]===false){toast('他今日已明确表示暂不愿留牌。可尊重其选择，日后再谈。');return;}if(expansionAuditionSelectBefore)expansionAuditionSelectBefore(id);};
const expansionAuditionConfirmBefore=actions.auditionConfirm;
actions.auditionConfirm=()=>{const ids=(state.audition?.selected||[]).slice();expansionAuditionConfirmBefore?.();if(state.audition?.status==='completed'){for(const id of ids){const p=PEOPLE.find(x=>x.id===id),r=state.relations[id];if(!p||!r)continue;rememberMind(id,'初次选秀中，女帝听完三轮问话后，双方确认留宫。日后仍要靠实际相处建立信任。','入宫');shiftMind(id,{security:6,expectation:5,disappointment:-3});}save();}};
const expansionMindBlockBefore=mindBlock;
mindBlock=function(p){const base=expansionMindBlockBefore(p),m=state.relations[p.id].mind,used=Object.values(m.dialogueCursor||{}).reduce((n,v)=>n+Number(v||0),0);return base.replace('</small>','</small><small>专属互动组合：每类最多20,480种 · 已使用'+used+'组</small>');};
const expansionNpcCardBefore=npcCard;
npcCard=function(p){const base=expansionNpcCardBefore(p),m=state.relations[p.id]?.mind;if(!m)return base;const used=Object.values(m.dialogueCursor||{}).reduce((n,v)=>n+Number(v||0),0);return base.replace('</div></article>','<p class="mini">'+currentMind(p)+' · 已留下'+used+'组专属对话记忆；相同互动类别不会立即重复。</p></div></article>');};
const expansionStyleCss=document.createElement('style');expansionStyleCss.textContent='.dialogue-mood{margin:6px 0 8px!important;padding:5px 7px;border-left:2px solid #b99177;background:#f8f0eb;color:#89646c!important;font-size:10px!important;line-height:1.6}.mind-block small+small{display:block;margin-top:5px;color:#9a747c}.scene-text .mind-stage{color:#a36b70;font-size:12px}';document.head.appendChild(expansionStyleCss);
// 启用旧存档兼容：没有新游标的角色从零开始；旧有记忆、心境与关系值均保留。
ensureMinds();for(const p of PEOPLE){const m=state.relations[p.id].mind;m.dialogueCursor=m.dialogueCursor||{};m.dialogueCycle=m.dialogueCycle||{};}
save();

// v6：自然对话层。保留原有互动、数值、心境与NPC生活系统，只修正对白组织方式。
const NATURAL_PLAYER_PROMPTS = {
 chat:{recent:'最近都在忙些什么？',home:'家乡那边最近可有来信？',interest:'闲下来时，你最喜欢做些什么？'},
 care:{listen:'最近有没有什么心事，愿意说给我听吗？',comfort:'这几日是不是太累了？先歇一歇吧。',gift:'这份东西合不合你的心意？',promise:'下个月再见一面，好不好？',bag:'这是上次出游买的，留给你。'},
 persuade:{support:'这件事，你愿意支持我吗？',work:'这件差事，你觉得该怎么安排？',reconcile:'你和他之间的事，能不能先说说你的看法？',recruit:'我想请你入宫，你自己愿意吗？',promote:'晋封之事，你可愿意？'},
 probe:{opinion:'你觉得我这个人如何？',worry:'最近是不是有件事让你放不下？'},
 scold:{remind:'我之前说过的规矩，你还记得吗？',stern:'这件事你为何擅作主张？',public:'你当众顶撞，是有何缘故？'},
 activity:{chess:'陪我下一局棋？',walk:'陪我出去走走吧。',spar:'陪我切磋几招？'},
 flirt:{compliment:'今日见你，心情都好些了。',miss:'我不召你时，你会不会也想见我？',confess:'我想认真问一句，你愿不愿与我更进一步？'},
 sleep:{ask:'今夜愿不愿留下？不愿也无妨。'},
 audition:{'0':'为何想到来应选？','1':'平日里最喜欢做些什么？','2':'你愿意入宫吗？若不愿，也可以直说。'}
};
const NATURAL_CORE_DIALOGUE = {
 xu:{
  chat:{recent:{stage:'许知衡把两份奏报合在一处，指尖还压着边角。',player:'朝中这阵子可还顺利？',reply:'“顺利谈不上。河工那边又递了两份相反的奏报，我让人把旧账也一并调来了。事情总得查清，不能只听谁说得好听。”'}},
  care:{listen:{stage:'许知衡合上手边的边报，没急着说无事。',player:'昨夜又没睡好？',reply:'“被你看出来了。边报来得晚，我看完才歇下。不是大事，只是还惦记几处关隘。”'}},
  activity:{chess:{stage:'许知衡把棋盒推到你面前，自己先拈起一枚黑子。',player:'陪我下一局棋？',reply:'“今日不让子了。上回输得不服，这回我想认真赢一次。”'}},
  flirt:{miss:{stage:'许知衡正要收起奏折，听见你的话，动作慢了些。',player:'我不召你时，你会不会也想见我？',reply:'“会。本来想等忙完再去寻你，没想到你先来了。”'}}
 },
 jiang:{
  chat:{recent:{stage:'姜太傅刚从国子监回来，手里还夹着一份策论。',player:'国子监最近可有好苗子？',reply:'“有一个，家境寻常，文章却写得扎实。只是性子太直，当堂把考官问住了。”他摇摇头，“倒让我想起陛下当年。”'}},
  care:{listen:{stage:'姜太傅揉了揉旧伤，见你看过来，便把手放回袖中。',player:'旧伤今天还疼吗？',reply:'“阴雨天会有些酸，太医开了膏药，已经用过了。陛下不必为这点旧毛病耽搁政务。”'}},
  activity:{walk:{stage:'姜太傅拿起手杖，陪你走到廊下。',player:'今日不谈政事，陪我走一段？',reply:'“好。书斋里坐久了，出去走走也好。只是陛下别走得太快，老臣可追不上。”'}}
 },
 ye:{
  chat:{recent:{stage:'叶承钧把算盘往旁边推了推，给你留出位置。',player:'南市最近生意怎么样？',reply:'“比上月好些，米价却还没降下来。运河那段淤得厉害，商队多绕了两日，运费都摊进米价里了。”'}},
  care:{listen:{stage:'叶承钧难得没有先讲笑话，只把茶盏放下。',player:'最近有没有什么烦心事？',reply:'“有。粮商压着货不肯出，我手里又没有足够的银子全收下来。”他叹了口气，“这事急不得，急了反倒让人钻空子。”'}},
  activity:{walk:{stage:'叶承钧把账册合上，顺手拿起外衣。',player:'带我去南市转转？',reply:'“好啊。那边新开了家点心铺，价钱公道，味道也不错。今日不带账房，只带银子。”'}},
  flirt:{compliment:{stage:'叶承钧原本正笑着，听你夸他，倒停了一瞬。',player:'你笑起来倒挺好看的。',reply:'“这句可不能记到账上，否则臣得天天翻出来看。”他笑意收了些，“陛下是在夸臣，还是有别的意思？”'}}
 },
 xie:{
  chat:{recent:{stage:'谢无咎将一张小笺压在茶盏旁，示意你先坐。',player:'东厂最近可有新消息？',reply:'“有两家外地商号来得蹊跷，掌柜换了三回，货单却是同一批人写的。奴才还在查，不想拿半截消息扰陛下。”'}},
  care:{listen:{stage:'谢无咎接过茶，嗓音听着有些哑。',player:'你嗓子怎么哑了？',reply:'“昨夜在宫门吹了些风，没什么大碍。太医开的药还在桌上，奴才一会儿便喝。”'}},
  activity:{walk:{stage:'谢无咎先看了眼宫门方向，确认有人值守才回身。',player:'陪我去宫外走走吧。',reply:'“可以。不过得换条不显眼的路，奴才不想陛下刚出宫门，就被半条街的人认出来。”'}},
  flirt:{miss:{stage:'谢无咎把笑意收了些，目光没有躲开。',player:'我若不召你，你会不会想见我？',reply:'“会。”他答得很轻，“只是奴才分得清什么时候该来，什么时候该等。”'}}
 },
 song:{
  chat:{recent:{stage:'宋玉衡把琴谱翻到最后一页，指尖停在未写完的地方。',player:'你那支新曲写完了吗？',reply:'“还差最后一段。前几日总觉得收尾太急，昨日改了三遍，终于顺耳一些了。”'}},
  care:{listen:{stage:'宋玉衡把琴谱合上，今天没有急着去碰琴弦。',player:'今日怎么没弹琴？',reply:'“心里有些乱，弹出来也不好听。不是不想见你，只是不想拿一支没弹好的曲子敷衍你。”'}},
  activity:{walk:{stage:'宋玉衡将新买的纸收进袖中，等你一道出门。',player:'陪我去挑些新纸和琴弦？',reply:'“好。纸铺老板认得我，琴弦也知道哪家做得稳。今日你替我挑颜色，我替你挑手感。”'}},
  flirt:{compliment:{stage:'宋玉衡指尖错了一弦，抬眼时耳尖已经微红。',player:'你弹琴时很好看。',reply:'“只夸琴，我还能接得住。”他别开眼，“夸我……下回等曲子弹完再说，免得我乱了拍子。”'}}
 },
 lu:{
  chat:{recent:{stage:'陆景明刚从校场回来，把护腕放在桌上。',player:'今日校场练得怎么样？',reply:'“新兵比昨日好些了，就是换箭慢。我让他们又练了两轮，最后总算跟上了。”'}},
  care:{listen:{stage:'陆景明把护腕松开，露出肩上的淤青。',player:'肩上的伤好些了吗？',reply:'“好多了，军医让我少拉几天重弓，我照做了。您别担心，没耽误当值。”'}},
  activity:{spar:{stage:'陆景明把轻弓取下来，先试了试弓弦。',player:'带我去校场试试弓。',reply:'“行，不过先用轻弓。我在旁边教您站姿，别一上来就拉满。”'}},
  flirt:{miss:{stage:'陆景明听见这话，笑意先从眼睛里冒出来。',player:'若我今天不来，你会不会失望？',reply:'“会有一点。不过您有政务要忙，我知道。等忙完了再见也行。”'}}
 },
 shen:{
  chat:{recent:{stage:'沈既白把礼部新仪注放到案上，旁边还压着几页旧档。',player:'礼部那套新仪注修得如何了？',reply:'“大体理顺了，还有两处旧称谓要再核一遍。原本以为半日能完，没想到牵出前朝的旧档。”'}},
  care:{listen:{stage:'沈既白把书签夹好，才抬头看你。',player:'家里最近没有为难你吧？',reply:'“父亲来信问了几次宫中情形，倒没有为难。只是他总担心我做事不够周全。”'}},
  activity:{walk:{stage:'沈既白将书合起，陪你到廊下坐坐。',player:'今日不看书，陪我去廊下坐坐。',reply:'“好。我也正想歇一会儿。今日风不大，坐着说说话正好。”'}},
  flirt:{miss:{stage:'沈既白理了理袖口，像是在认真斟酌该如何回答。',player:'你不必每次见我都这么拘谨。',reply:'“臣知道。只是每次见陛下，还是会先想着礼数，慢慢才能想起旧日怎么说话。”'}}
 },
 gu:{
  chat:{recent:{stage:'顾长庚把一页算稿摊开，旁边堆着几本借来的旧书。',player:'国子监最近课业多吗？',reply:'“还好，就是漕运那篇策论改了三回。先生说我列了太多数字，没把百姓为什么受影响讲清楚。”'}},
  care:{listen:{stage:'顾长庚把书合上，像是终于肯从课业里抬起头。',player:'家里的事让你分心了吗？',reply:'“有一点。父亲来信说学塾漏雨，我一直想着该寄多少银子回去。”'}},
  activity:{walk:{stage:'顾长庚把书签夹好，拿起放在一旁的旧书。',player:'陪我去书肆看看吧。',reply:'“好！我上次看中的那本书还没卖出去。”他说完才意识到自己答得太快，笑了笑，“若陛下不嫌书肆吵，我带路。”'}},
  flirt:{compliment:{stage:'顾长庚摸了摸脸，像是不太习惯被这样夸。',player:'你说起喜欢的东西时，眼睛会发亮。',reply:'“有吗？大概是因为终于有人肯听我讲这些，不会一听见河道、账册就走开。”'}}
 },
 pei:{
  chat:{recent:{stage:'裴知节把北境抚恤名册放到一旁，先向你行礼。',player:'北境那边最近怎么样？',reply:'“边上还算安稳。旧营抚恤只剩两户没核清，我托人回去问了，应该很快有消息。”'}},
  care:{listen:{stage:'裴知节活动了一下肩膀，神情倒不像在校场时那么轻松。',player:'你是不是有心事？',reply:'“有两户抚恤的地址一直对不上，怕拖久了家里人又得跑一趟。别的倒没什么。”'}},
  activity:{spar:{stage:'裴知节取来一张轻弓，先替你试了试弓弦。',player:'带我去校场试试弓。',reply:'“行，不过先用轻弓。我在旁边教您站姿，别一上来就拉满。”'}},
  flirt:{miss:{stage:'裴知节抬手摸了摸护腕，答得很干脆。',player:'若我想见你，你会不会立刻来？',reply:'“只要不是当值，我会来。当值时我也会先回话，不让陛下等着。”'}}
 },
 wen:{
  chat:{recent:{stage:'温如璧把新到的药材簿翻到一页，指给你看。',player:'太医院最近新进了什么药材？',reply:'“北地送来几味药，性温，适合冬日用。不过其中一味和江南常见的很像，已经单独标了出来，免得抓错。”'}},
  care:{listen:{stage:'温如璧把医案合上，认真看了看你的神色。',player:'最近有没有哪件事让你为难？',reply:'“有一味药的用量，旧医案和新方子记得不一样。我不敢擅自改，已经请太医院再核。”'}},
  activity:{walk:{stage:'温如璧收好药材簿，陪你到院里走走。',player:'陪我去院里坐坐，别总待在药房。',reply:'“好。院里的桂花还没谢，我早上经过时闻见了。”'}},
  flirt:{compliment:{stage:'温如璧怔了一下，随即有些不好意思地笑了。',player:'你对谁都这么细心吗？',reply:'“也不是。只是怕自己漏看了什么。对陛下……会多留意一点。”'}}
 }
};
function naturalPrompt(category,topic,playerText,p){
 const key=String(topic??'');
 if(category==='probe'&&key.startsWith('relation:')){
  const other=PEOPLE.find(x=>x.id===key.slice(9));
  return '你和'+(other?.name||'那位大人')+'近日相处得如何？';
 }
 const mapped=NATURAL_PLAYER_PROMPTS[category]?.[key];
 if(mapped)return mapped;
 if(typeof playerText==='string'&&playerText&&!/你问起|你没有|你把|你请|你希望|你先|你试着|你提出|你将/.test(playerText))return playerText;
 const fallback={
  chat:['最近可有新鲜事？','这阵子心里最惦记什么？'],
  care:['今日气色不大好，是不是累了？','有什么事不必一个人扛着。'],
  persuade:['你觉得怎样办更妥当？','这件事你愿意和我一起承担吗？'],
  probe:['你心里真正的想法是什么？','这件事还有什么我不知道的？'],
  scold:['你先说说事情经过。','你可知道这样做会有什么后果？'],
  activity:['今日想做点什么？','陪我消磨一会儿时辰吧。'],
  flirt:['我有些想你了。','你可曾也这样想过？'],
  sleep:['今夜愿意留下吗？不愿也无妨。'],
  audition:['为何想到来应选？','平日里最喜欢做些什么？']
 }[category]||['你愿意同我说说吗？'];
 return fallback[naturalHash(p?.id+'|'+category+'|'+key+'|'+currentMind(p))%fallback.length];
}
function naturalHash(s){let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
function naturalComposeDialogue(p,cursorKey,category,topic,baseText,playerText,baseResult){
 ensureMinds();
 const r=state.relations[p.id],m=r.mind;
 m.dialogueCursor=m.dialogueCursor||{};m.dialogueCycle=m.dialogueCycle||{};
 const cursor=Number(m.dialogueCursor[cursorKey]||0),cycle=Number(m.dialogueCycle[cursorKey]||0);
 m.dialogueCursor[cursorKey]=cursor+1;
 const fallback=baseResult?null:expansionBaseLine(p,category,topic,cursor);
 const stageText=(baseResult?.stage||fallback?.[4]||'').trim();
 const style=expansionStyle(p),openerPool=EXPANSION_OPENERS[style]||EXPANSION_OPENERS['温柔体贴'];
 const stage=stageText&&stageText.length<=88?stageText:openerPool[naturalHash(p.id+'|'+category+'|'+topic+'|'+cursor)%openerPool.length];
 const reply=(baseResult?.reply||baseText||fallback?.[5]||revisionRow(p,category)?.reply||'他想了想，没有拿场面话敷衍你，只把眼下的实情说了出来。').trim();
 const prompt=baseResult?.scene?.player||naturalPrompt(category,topic,playerText,p);
 const location=baseResult?.scene?.location||p.location||p.home||p.birthplace||'宫中';
 const result={id:baseResult?.id||fallback?.[0]||'NAT-'+p.id+'-'+cursorKey+'-'+cycle+'-'+cursor,stage,reply,scene:{player:prompt,location},mood:currentMind(p),variant:cursor,capacity:EXPANSION_CAPACITY};
 m.lastGeneratedDialogue=result;
 return result;
}
// The original mind selector already chooses a line by NPC voice, current mood and topic,
// and records its ID in the save. Keep that source selection instead of adding generic fragments.
const naturalReadFictionBefore=expansionReadBefore;
readFiction=function(p,category,topic){
 if(!p||!state.relations[p.id]||!['chat','care','activity','flirt','persuade','probe','scold','sleep'].includes(category))return naturalReadFictionBefore?naturalReadFictionBefore(p,category,topic):null;
 const m=state.relations[p.id].mind;m.used=m.used||[];
 const human=NATURAL_CORE_DIALOGUE[p.id]?.[category]?.[topic];
 if(human){
  const id='HUMAN-'+p.id+'-'+category+'-'+topic;
  if(!m.used.includes(id)){
   m.used.push(id);m.used=m.used.slice(-40);
   const entry={id,stage:human.stage,reply:human.reply,scene:{player:human.player,location:p.location||p.home||p.birthplace||'宫中'}};
   return naturalComposeDialogue(p,category,category,topic,entry.reply,entry.scene.player,entry);
  }
 }
 const original=naturalReadFictionBefore?naturalReadFictionBefore(p,category,topic):null;
 return naturalComposeDialogue(p,category,category,topic,original?.reply,playerTextForNatural(category,topic,p),original);
};
function playerTextForNatural(category,topic,p){return naturalPrompt(category,topic,null,p);}
composeExpandedDialogue=function(p,cursorKey,category,topic,baseText,playerText){
 return naturalComposeDialogue(p,cursorKey,category,topic,baseText,playerText,null);
};
// Core audition conditions, refusal rules and selection actions remain unchanged; only answer wording is individualized.
const naturalAuditionBaseBefore=expansionAuditionBase;
expansionAuditionBase=function(p,index){
 const candidate={
  shen:['家里是提过几次。起初我没答应，后来想想，留在馆阁也未必能做出什么，便想来看看。','经义、书法都学过一些。最近在抄一册旧舆图，发现几处地名和新志对不上。'],
  gu:['先生举荐了我，我自己也想来看看。原本打算回江南帮父亲教书，后来觉得出来走走也好。','算学和策论是我最熟的，最近在查漕运旧账。先生说我算得太细，却忘了写清百姓受了什么影响。'],
  pei:['家里让我来，我自己也想换个地方做事。北境待久了，总不能一辈子只认得营门。','骑射练过几年，闲时会修弓。北境旧营还有几户抚恤没核清，我一直惦记着。'],
  wen:['父亲说宫里缺懂药材的人，我便来了。说不紧张是假的，我也想看看宫里的日子是什么样。','药材辨识和医案是我最熟悉的。闲时会弹琴，不过在太医院里，琴声常被煎药的声音盖过去。']
 }[p.id];
 if(candidate&&index<2)return candidate[index];
 return naturalAuditionBaseBefore(p,index);
};
// Keep the three-stage audition, its consent calculation, and refusal consequences intact.
function naturalQuestionRegression(){
 const ids=['chat','care','persuade','probe','scold','activity','flirt','sleep'];
 const promptCount=ids.reduce((n,k)=>n+Object.keys(NATURAL_PLAYER_PROMPTS[k]||{}).length,0);
 const humanCount=Object.values(NATURAL_CORE_DIALOGUE).reduce((n,p)=>n+Object.values(p).reduce((m,c)=>m+Object.keys(c).length,0),0);
 return {categories:ids.length,concretePlayerPrompts:promptCount,coreHumanReplies:humanCount,gameplayBindings:['interactionTopic','applyInteraction','actions.auditionAsk','actions.auditionSelect','actions.auditionConfirm'].every(k=>typeof (k==='interactionTopic'?interactionTopic:k==='applyInteraction'?applyInteraction:actions[k.split('.').pop()])==='function')};
}
window.__naturalDialogueAudit=naturalQuestionRegression;
ensureMinds();save();

// V7 · 对话语义与亲密互动单问一答。
const naturalComposeV7Before=naturalComposeDialogue;
naturalComposeDialogue=function(p,cursorKey,category,topic,baseText,playerText,baseResult){
 const result=naturalComposeV7Before(p,cursorKey,category,topic,baseText,playerText,baseResult);
 // 旧语料里的 scene.player 有时是叙事说明，不是女帝说出口的话；统一使用真实问句。
 result.scene=result.scene||{};
 result.scene.player=naturalPrompt(category,topic,playerText,p);
 return result;
};
intimacyQuestion=function(){
 if(!session||session.left<=0)return;
 const p=PEOPLE.find(x=>x.id===session.id),r=state.relations[p.id],reason=sleepReason(p,r);
 if(reason){toast(reason);return;}
 const line=readFiction(p,'sleep','ask'),mood=currentMind(p);
 const willing=['热恋','安心','期待','平静'].includes(mood);
 const prompt='今夜愿不愿留下？若不愿，我们改日再约。';
 const refusal={
  吃醋:'“今夜先不留宿。我有些话想问清楚，免得又自己乱想。”',
  委屈:'“我还想把之前那件事说完。等心里舒服些，再陪陛下坐一会儿。”',
  失望:'“今夜不留了。不是不想见，只是想先看看说好的事能不能做到。”',
  戒备:'“今夜先不了。我们还没熟到那一步，陛下别急。”',
  恼怒:'“我现在还不想这样相处。等气消了，再谈吧。”',
  疏离:'“今夜不留。公事我会照办，私下的事改日再说。”'
 };
 const answer=willing
  ?(line&&line.reply?line.reply:'“我愿意留下。不过今日不必说场面话，陪我坐一会儿就好。”')
  :(refusal[mood]||'“今夜先改日吧。我想按自己的心意来，不想勉强答应。”');
 session.intimacyConsent=willing?p.id:null;
 openModal(p.name+' · 今夜',r.rank,
  '<div class="scene-text">'+(line&&line.stage?'<span class="mind-stage">'+mindEscape(line.stage)+'</span><br><br>':'')+
  '你问：“'+mindEscape(prompt)+'”<br><br>“'+mindEscape(answer.replace(/^“|”$/g,''))+'”</div>'+
  '<div class="opts">'+
  (willing?'<button class="opt" data-action="intimacyConfirm"><b>留他过夜</b><small>另耗1行动、本次1次互动；今夜只安排一次。</small></button>':'<p class="mini">对方已经表达了今晚的意愿。尊重这次答复，不扣行动和互动次数。</p>')+
  '<button class="opt" data-action="intimacyCancel"><b>今日先到这里</b><small>不扣行动和互动次数。</small></button></div>',
  '相处 · 本人意愿');
 save();
};


// V8 · 文案规范：不写心态、神态旁白；用可观察动作承载场景，人物立场由对白表达。
(function(){
 const V8_CUE = /(神色|神情|神态|目光|眼神|眼底|眉间|脸色|笑意|耳尖|心境|心态|情绪|心中|心里|心事|思绪|不安|期待|失望|委屈|恼怒|忧虑|吃醋|安心|像是|似乎|仿佛)/;
 function v8CleanStage(stage,p){
  const raw=String(stage||'').trim();
  const parts=raw.split(/(?<=[。！？；])/).map(x=>x.trim()).filter(Boolean);
  const kept=parts.filter(x=>!V8_CUE.test(x));
  return kept.join('') || ((p?.name||'人物')+'在'+(p?.location||p?.home||'宫中')+'与你会面。');
 }
 function v8CleanReply(reply){
  const parts=String(reply||'').split(/(“[^”]*”)/g);
  return parts.map((part,i)=>{
   if(i%2===1)return part;
   return V8_CUE.test(part)?'':part;
  }).join('').replace(/\s{2,}/g,' ').trim();
 }
 function v8CleanRow(row,p){
  if(!row)return row;
  row.stage=v8CleanStage(row.stage,p);
  row.reply=v8CleanReply(row.reply);
  return row;
 }
 const v8ComposeBefore=naturalComposeDialogue;
 naturalComposeDialogue=function(p,cursorKey,category,topic,baseText,playerText,baseResult){
  return v8CleanRow(v8ComposeBefore(p,cursorKey,category,topic,baseText,playerText,baseResult),p);
 };
 const v8ReadBefore=readFiction;
 readFiction=function(p,category,topic){
  return v8CleanRow(v8ReadBefore(p,category,topic),p);
 };
 const v8RevisionBefore=revisionRow;
 revisionRow=function(p,category){
  return v8CleanRow(v8RevisionBefore(p,category),p);
 };
 // 每日自主行动只记录具体事务，不用心理活动替代行为。
 const V8_DAILY={
  '温柔体贴':['把茶水送到值房，顺路替同僚取回家书。','整理花房的花木名册，并将新开的花枝剪下送去医馆。'],
  '清冷克制':['核对三份文书的日期与印章，补齐缺漏后交还值房。','在藏书阁查完旧档，将引用页码抄录进案卷。'],
  '明朗直率':['从演武场带回训练记录，并把多余的热栗子分给同伴。','替同伴把争执经过写成记录，交由值房存档。'],
  '骄矜自尊':['将新作誊清，附上修改稿送往文馆。','完成一份诗稿校订，并取回前次送审的批注。'],
  '敏感多思':['给家中回信，逐项交代近况与寄回的银钱。','整理旧信与账目，将需要回复的事项列成清单。'],
  '圆融世故':['分别拜访两处府邸，核对宴席名单与来往礼单。','从东市带回商号消息，并向相关官员核实来源。'],
  '严正守礼':['复核名册与章程，退回一份缺少签押的文书。','按时点验值守名册，将缺勤记录送交主管官员。'],
  '野心进取':['重写请命折，补上人手、时限与粮草清单。','在演武场完成加练，并提交新的训练安排。'],
  '疏朗洒脱':['去西市买伞和纸，回宫时把沿途物价记在册上。','沿宫道巡看修缮进度，将需要补修的地方逐项记下。'],
  '务实重利':['盘点库房货物，重新核算本月采买支出。','核对商队运费与仓储账目，列出可节省的开支。'],
  '寡言重诺':['修好旧砚并归还原主，随后完成当日值守。','按约送回借阅的书册，并完成交办的差事。'],
  '戒备善谋':['核对来往名册与密报来源，将原件分别封存。','复查门禁记录与出入凭据，整理出一份待核名单。']
 };
 if(typeof AGENCY_DAILY==='object')Object.assign(AGENCY_DAILY,V8_DAILY);
 window.__dialogueStyleAudit=function(){
  const samples=[];
  for(const p of PEOPLE.slice(0,Math.min(12,PEOPLE.length))){
   for(const category of ['chat','care','activity','flirt']){
    const row=readFiction(p,category,category==='activity'?'walk':category==='flirt'?'miss':category==='care'?'listen':'recent');
    if(row)samples.push({name:p.name,category,stage:row.stage,reply:row.reply,stageHasCue:V8_CUE.test(row.stage)});
   }
  }
  return {version:'V8',rule:'场景只保留可观察动作；对白保留人物直接表达；不新增心态或神态旁白。',samples};
 };
})();

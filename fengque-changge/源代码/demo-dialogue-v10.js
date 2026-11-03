/* 凤阙长歌 V10 · 人物关系与自然对白层
 * 参考方向：长篇叙事中的潜台词与角色声线、乙游关系阶段与记忆回收、
 * 宫廷群像中 NPC 自己的公务、家事、交往和边界。
 * 仅改人物对白选取与 NPC-NPC 场景呈现，不改数值、行动消耗、事件触发或朝堂流程。
 */
(function () {
  'use strict';
  if (window.__FENGQUE_V10_PATCHED__) return;

  var oldRevisionRow = window.revisionRow;
  var oldReadFiction = window.readFiction;
  var oldInteractionTopic = window.interactionTopic;
  var oldVisit = window.visit;
  var oldAgencyOpen = window.agencyOpen;

  if (typeof oldRevisionRow !== 'function' ||
      typeof oldReadFiction !== 'function' ||
      typeof oldInteractionTopic !== 'function') {
    throw new Error('V10 未找到原有对白入口，已停止加载。');
  }

  var activeTopic = null;
  var topicCache = new Map();
  var lastDialogue = null;
  var auditCounts = { authored: 0, special: 0, fallback: 0, scenes: 0 };

  var TOPIC_PROMPTS = {
    chat: {
      recent: '近来在忙什么？',
      home: '你家里近来可好？',
      interest: '闲下来时，你喜欢做些什么？'
    },
    care: {
      listen: '近来可有什么事想同我说？',
      comfort: '今日忙了许久吧？先坐下歇会儿。',
      gift: '这个是特意替你留的，看看合不合心意。',
      bag: '出门时看见这个，想着你或许用得上。',
      promise: '下个月的日子，我们先约好。'
    },
    persuade: {
      support: '这件事，我想听听你愿不愿意支持。',
      work: '我有一桩差事，想先听听你的主意。',
      reconcile: '你和他之间的事，可还有转圜的余地？',
      recruit: '你可愿意入宫？不必急着答。',
      promote: '这次晋封，你自己是怎么想的？'
    },
    probe: {
      opinion: '你如何看待如今的自己？',
      worry: '近来可有哪件事一直放不下？'
    },
    scold: {
      remind: '这件事我想提醒你一句。',
      stern: '今日这件事，你得给我一个说法。',
      public: '当着众人的面，我要把规矩说清。'
    },
    activity: {
      chess: '陪我下一局棋？',
      walk: '陪我出去走走吧。',
      spar: '陪我切磋几招？'
    },
    flirt: {
      compliment: '今日见你，有句话想认真说。',
      miss: '我不召你时，你会不会也想见我？',
      confess: '我想认真问一句，你愿不愿与我更进一步？'
    },
    sleep: {
      ask: '今夜愿不愿留下？不愿也无妨。',
      stay: '今夜便早些歇息吧。'
    }
  };

  var SCENE_ACTIONS = {
    chat: {
      recent: '把手边的文书合上，给你腾出座位。',
      home: '将一封家书收进匣中，请你坐下。',
      interest: '把手边的书卷放到一旁。',
      default: '停下手里的事，与你说话。'
    },
    care: {
      listen: '放下手里的活计，坐到你对面。',
      comfort: '把茶盏放到桌边，留出说话的时间。',
      gift: '接过你递来的东西，放在案边。',
      bag: '将你带来的小物收好。',
      promise: '取来日历，把约定的日子记下。',
      default: '放下手边的事，听你说话。'
    },
    persuade: {
      support: '将相关文书摊开，与你商量安排。',
      work: '取出手边的文书，等你说明差事。',
      reconcile: '把两人的往来记录放到桌上。',
      default: '把手里的文书放到一旁。'
    },
    probe: {
      opinion: '收起手边的纸页，与你单独说话。',
      worry: '把未写完的信笺合起来。',
      default: '停下手里的事，等你开口。'
    },
    scold: {
      remind: '放下手里的东西，先听你把话说完。',
      stern: '将手里的文书放回案上。',
      public: '停下手里的事，等你当面问话。',
      default: '站定后与你说话。'
    },
    activity: {
      chess: '取出棋盘，在案边摆好棋子。',
      walk: '拿起外袍，与你一道走到廊下。',
      spar: '取来护腕，与你一道前往演武场。',
      default: '收好手边的东西，准备陪你活动一会儿。'
    },
    flirt: {
      compliment: '放下手里的东西，听你把话说完。',
      miss: '停下手里的事，与你说话。',
      confess: '请旁人退下，留出单独说话的空当。',
      default: '停下手里的事，与你说话。'
    },
    sleep: {
      ask: '让宫人退到门外，等你先开口。',
      stay: '让宫人退到门外，与你一道歇下。',
      default: '让宫人退到门外。'
    }
  };

  var VOICE_RULES = {
    '温柔体贴': { direct: 1, length: 1, strategy: '先接住对方的话，再说自己的事；不替别人做决定。' },
    '清冷克制': { direct: 3, length: 0, strategy: '少解释，不主动讨好；重要的话说清便收住。' },
    '明朗直率': { direct: 3, length: 1, strategy: '先说结论，愿意时就答应，不愿意便直说。' },
    '骄矜自尊': { direct: 2, length: 1, strategy: '在意尊重与选择权，不把认真说成讨赏。' },
    '敏感多思': { direct: 1, length: 2, strategy: '会确认对方的意思，但不把每句话都写成自我怀疑。' },
    '圆融世故': { direct: 1, length: 2, strategy: '先照顾场面，再把真正的条件摆出来。' },
    '严正守礼': { direct: 3, length: 1, strategy: '讲依据和责任，不用客套话回避问题。' },
    '野心进取': { direct: 3, length: 1, strategy: '关注结果、机会和承担，不空谈志向。' },
    '疏朗洒脱': { direct: 2, length: 0, strategy: '轻快但不轻浮，不把每件小事都说成心事。' },
    '务实重利': { direct: 3, length: 1, strategy: '先谈成本、时间和回报；不无条件答应。' },
    '寡言重诺': { direct: 2, length: 0, strategy: '短句为主，答应的事落到行动上。' },
    '戒备善谋': { direct: 0, length: 1, strategy: '不轻易交底；可以反问、保留或要求证据。' }
  };

  // 六位核心人物只在对应话题出现个人细节，不把人设标签机械地贴在每一句上。
  var SPECIAL_LINES = {
    xu: {
      'chat|recent': [
        '近来都在清理用人章程。旧档有两处对不上，我想查明白再递上去。',
        '今日刚把一份人事名册核完，还有几处要与吏部旧档对照。'
      ],
      'care|listen': [
        '昨夜看折子到很晚，今日有些乏。墨也兑浓了，废了两张纸。',
        '不是什么大事，只是连着几夜没歇好。待这几份折子批完，我会去歇。'
      ],
      'flirt|miss': [
        '会。只是想着你忙，不好总拿私事去扰你。',
        '会想。只是每回拿起笔，又觉得不该拿私事耽误你，最后还是搁下了。'
      ]
    },
    jiang: {
      'chat|recent': [
        '春课还没定稿。我把讲义里一句“当依师言”删了，如今该由陛下自己决断。',
        '这几日都在改春课。讲义写得太满，反倒没有留给学生自己思考的地方。'
      ],
      'care|listen': [
        '旧伤没什么大碍。倒是这几日讲义改得多，手腕有些酸。',
        '太医开的膏药还在用。陛下不必为这点小事耽搁政务。'
      ],
      'chat|interest': [
        '闲时还是写字。人老了，别的未必学得动，这点耐心还在。',
        '近来在抄一册旧书。字帖换了几本，还是从前那本最顺手。'
      ]
    },
    ye: {
      'chat|recent': [
        '春账还有两笔没平，家里又催信。钱粮的事不算难，难在两头都要交代。',
        '这几日都在核账。运费涨了些，南市的米价也跟着动，我得再算一遍。'
      ],
      'care|listen': [
        '有一笔旧账，本来不急着收。偏偏家里来信催了，我得想个两全的法子。',
        '家里来信了。不是坏事，只是有些话隔着纸说不清，得找时间回去一趟。'
      ],
      'flirt|compliment': [
        '夸账目，臣能接；夸臣本人，倒得先问问陛下是不是另有所图。',
        '这句若记到账上，可得算作一笔好处。陛下今日倒舍得夸人。'
      ]
    },
    xie: {
      'chat|recent': [
        '最近在查几家外地商号。账目看着齐整，人却换得太勤，得再核一遍。',
        '有两条消息还没证实。等我把来路查清，再呈给陛下，不拿半截话扰您。'
      ],
      'care|listen': [
        '嗓子好多了。昨夜在宫门值守，回来才喝药，往后不敢拖了。',
        '没什么大碍。太医开的药已经喝了，陛下不必再叫人来问。'
      ],
      'probe|worry': [
        '有件旧书铺的事还没查清。等我找到掌柜，再同您说。',
        '有些旧事暂时还没有线索。我不想凭猜测开口，再等等。'
      ],
      'flirt|miss': [
        '会想。只是没查清的事太多，我常分不清该先来见您，还是先把差事办完。',
        '会。只是有时刚走到宫门，又想起还有一封密报没核完。'
      ]
    },
    song: {
      'chat|recent': [
        '新曲还差最后一转。前几日改得太满，今日想把那一段空出来。',
        '这几日都在试新曲的收尾。弹得太急了，听起来反倒不像我自己。'
      ],
      'chat|interest': [
        '闲时还是练琴。最近更想练一首简单的，难的曲子弹得多了，反而容易忘了怎么听。',
        '喜欢听人唱旧调。新曲固然好，旧调里有些地方，改不得。'
      ],
      'flirt|compliment': [
        '若只夸琴，我能信。若夸我，得说具体些，不然我不知道该记哪一句。',
        '夸得太笼统，我可不敢收。陛下说说，究竟喜欢哪一段？'
      ]
    },
    lu: {
      'chat|recent': [
        '新兵的靶旗刚教完。我又去膳房问了点心火候，弓我会，做吃的还得再学。',
        '这几日都在校场。膳房那道酥饼还没学会，今日打算再去问一回。'
      ],
      'care|listen': [
        '肩上的伤不碍事，护腕换了新的。倒是厨下那道酥饼，我还没试成。',
        '伤已经好多了。比起这个，我更想知道陛下肯不肯尝一口我新做的点心。'
      ],
      'activity|spar': [
        '行。今日不让你，先从基本招式练起。',
        '来吧。先走三招，陛下若能接住，我再教下一式。'
      ],
      'flirt|miss': [
        '会。想过几回，也想过直接来找你。可我怕你正忙，便先把该练的箭练完了。',
        '会啊。只是每回想来，又怕你在忙。下次我先问一声，不在门外转圈了。'
      ]
    }
  };

  var NPC_SCENE_OPEN = {
    '温柔体贴': ['这件事一直搁着也不是办法。我先把我的话说清，你听完再讲。', '我不想为了这点事同你生分，咱们把话讲明白吧。'],
    '清冷克制': ['上回的话没说完。今日把缘由摆出来。', '这件事若有分歧，就把各自的理由讲清。'],
    '明朗直率': ['我不绕弯了，那天我确实不服。', '有话就当面说。一直躲着也不是办法。'],
    '骄矜自尊': ['我不是来认输的，只是不想一直这么僵着。', '你若觉得我有错，可以直说，不必让旁人替你传话。'],
    '敏感多思': ['我想问清楚。那日你没接我的话，是不方便，还是不愿意？', '这几天我一直没想明白，还是想亲口问你一句。'],
    '圆融世故': ['外头的话我已经替你圆过去了，咱们之间就不必再绕。', '场面上的话说够了，今日我想听你说实话。'],
    '严正守礼': ['事情该按规矩办，但你的理由我也愿意听。', '先把经过讲清，再谈谁该承担责任。'],
    '野心进取': ['这件事耽误不得。我们把分工和责任重新定下来。', '我不想再争谁先开口，事情总得有人做完。'],
    '疏朗洒脱': ['总这么僵着也没意思。今日说开，改日还好见面。', '先别端着了。事情归事情，人还是要见的。'],
    '务实重利': ['先别讲情面，把账和责任一项项对清楚。', '话说开不难，难的是以后怎么做。今日定个章程吧。'],
    '寡言重诺': ['上回的事，今日说清。', '我来不是为了吵架，只想把答应过的事对一遍。'],
    '戒备善谋': ['我只问一件事：那天的话，有几分是真的？', '我可以听你解释，但不会只凭一句话就信。']
  };

  var NPC_SCENE_REPLY = {
    '温柔体贴': ['我不是不肯帮你，只是那日你没先同我商量。', '我介意的不是结果，是你替我做了决定。'],
    '清冷克制': ['你要的答复，我今日可以给。先把前因后果说清。', '若要我负责，我认；若要我认下没做过的事，不行。'],
    '明朗直率': ['我也有做得不对的地方。可你当时一句话都没问我。', '你早这样问，我那天就不会转身走了。'],
    '骄矜自尊': ['我不是不能退让，只是不想每次都由我先低头。', '你当众驳我，我总得给自己留点脸面。'],
    '敏感多思': ['我不是不想解释，是怕说出来又被当成借口。', '你若真想听，我就从头说。只是别听一半便下结论。'],
    '圆融世故': ['我替你顾了场面，也希望你能顾一顾我的处境。', '旁人面前我不会拆你的台，私下也请给我一句准话。'],
    '严正守礼': ['公事可以另议，但该由谁负责，不能含糊过去。', '你若认为我有失职之处，请把依据拿出来。'],
    '野心进取': ['事情要做成，就不能一直争谁的面子更重要。', '把人手和时限定下来，我愿意接着做。'],
    '疏朗洒脱': ['我不想为一句话记仇。只是下回别再让我猜。', '事情说开就好，改日还能一道喝酒下棋。'],
    '务实重利': ['谁先垫了银子、谁担了责任，先把账对上。', '话可以慢慢说，欠下的那一笔先别装没看见。'],
    '寡言重诺': ['我记着。以后有事，直接来找我。', '好。该我做的，我会补上。'],
    '戒备善谋': ['你今日愿意把话说清，我便再听一次。', '证据和来往记录都在。先看完，再说信不信。']
  };

  var RELATIONSHIP_BANDS = {
    formal: '礼数周全，先谈眼前的事，不主动交底。',
    familiar: '可以自然说些近况，也会记得对方的习惯。',
    close: '愿意分享私人细节，不必句句客套。',
    intimate: '可以直接表达想念和不满，但不强行撒糖。',
    strained: '话会变少，先处理眼前问题，不急着和好。'
  };

  function hash(text) {
    var n = 2166136261;
    for (var i = 0; i < String(text).length; i++) {
      n ^= String(text).charCodeAt(i);
      n = Math.imul(n, 16777619);
    }
    return n >>> 0;
  }
  function safeText(value) { return String(value == null ? '' : value).trim(); }
  function escapeHtml(value) {
    return safeText(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function normalizeTopic(topic) {
    var value = safeText(topic || 'recent');
    if (value.indexOf('relation:') === 0) return 'opinion';
    if (value.indexOf('exclusive:') === 0) return 'recent';
    if (value === 'stay') return 'ask';
    return value;
  }
  function profileOf(person) {
    try {
      return (CAST_DATA && CAST_DATA.profiles || []).find(function (x) { return x.id === person.id; }) || null;
    } catch (_) { return null; }
  }
  function mindOf(person) {
    var relation = state.relations[person.id] || {};
    return relation.mind || {};
  }
  function relationshipBand(person) {
    var r = state.relations[person.id] || {};
    var mood = typeof currentMind === 'function' ? currentMind(person) : '平静';
    if (['恼怒', '失望', '委屈', '疏离'].indexOf(mood) >= 0) return 'strained';
    if (Number(r.aff || 0) >= 72 && Number(r.love || 0) >= 35) return 'intimate';
    if (Number(r.aff || 0) >= 55 && Number(r.loyalty || 0) >= 55) return 'close';
    if (Number(r.aff || 0) >= 30) return 'familiar';
    return 'formal';
  }
  function activeMood(person) {
    return typeof currentMind === 'function' ? currentMind(person) : '平静';
  }
  function relationshipLine(person) {
    var band = relationshipBand(person);
    return RELATIONSHIP_BANDS[band] || RELATIONSHIP_BANDS.formal;
  }
  function getCurrentTopic(person, category) {
    if (activeTopic) return normalizeTopic(activeTopic);
    try {
      if (state.agency && state.agency.currentTopic && session &&
          session.id === person.id && session.section === category) {
        return normalizeTopic(state.agency.currentTopic);
      }
    } catch (_) {}
    return null;
  }
  function topicPrompt(category, topic, originalScene) {
    var prompt = TOPIC_PROMPTS[category] && TOPIC_PROMPTS[category][topic];
    if (prompt) return prompt;
    if (originalScene && originalScene.player) {
      var original = safeText(originalScene.player);
      if (original.length <= 38 && !/一事，我想听您亲口说/.test(original)) return original;
    }
    return '你愿意同我说说吗？';
  }
  function sceneLine(person, category, topic) {
    var group = SCENE_ACTIONS[category] || {};
    var action = group[topic] || group.default || '停下手里的事，与你说话。';
    return safeText(person.name || '他') + action;
  }
  function relationTonePenalty(reply, band) {
    var text = safeText(reply);
    var intimateWords = /(想念|想你|心意|喜欢你|舍不得|亲近)/;
    var distantWords = /(不便相告|不必再问|私事不谈|与我无关|无可奉告)/;
    if (band === 'formal' && intimateWords.test(text)) return -4;
    if ((band === 'close' || band === 'intimate') && distantWords.test(text)) return -1;
    if (band === 'strained' && /(我也想你|今日见你便很好|只想与你相伴)/.test(text)) return -4;
    return 0;
  }
  function topicRelevanceScore(reply, category, topic) {
    var text = safeText(reply);
    var words = {
      recent: /(近日|近来|今日|这几日|手头|正在|忙|差事|文书|奏折|账|练|查|家书|校场)/,
      home: /(家|父|母|兄|弟|姐|妹|祖|故乡|家书|族)/,
      interest: /(喜欢|闲时|平日|琴|棋|书|画|骑|射|读|花|做饭|点心|散步)/,
      listen: /(这几日|最近|昨夜|家里|旧伤|来信|烦|一直|未完|没想好|不是什么大事)/,
      comfort: /(歇|休息|累|忙|茶|坐|睡|不必|多谢)/,
      gift: /(收下|喜欢|记得|留着|谢|多谢)/,
      bag: /(收下|用得上|带来|记得|多谢)/,
      promise: /(约|下月|日子|记得|等|准信)/,
      support: /(支持|人手|责任|风险|可以|愿意|不妥)/,
      work: /(差事|安排|期限|人手|章程|办法|主意|结果)/,
      reconcile: /(谈|说清|误会|见面|道歉|各退一步|不再争)/,
      opinion: /(觉得|认为|自己|看法|选择|本事|想法)/,
      worry: /(担心|放心|还没|没有查清|不便|以后|等)/,
      remind: /(记住|下回|规矩|提醒|会改|知道)/,
      stern: /(缘由|经过|错|责任|认|解释|说清)/,
      public: /(规矩|当众|礼数|章程|责任|遵命)/,
      chess: /(棋|输|赢|落子|棋盘)/,
      walk: /(走|廊|散步|出去|园子|路)/,
      spar: /(招|练|校场|护腕|剑|枪|弓|箭)/,
      compliment: /(夸|好看|好听|琴|文章|本事|认真|不敢当)/,
      miss: /(想|见|念|等|来|惦记)/,
      confess: /(愿意|心意|认真|答复|关系|拒绝|考虑)/,
      ask: /(愿意|留下|今夜|不愿|改日|歇息)/
    };
    var rule = words[topic] || words[category];
    if (!rule) return 0;
    return rule.test(text) ? 3 : -2;
  }
  function cleanAuthoredReply(reply) {
    var text = safeText(reply).replace(/\s+/g, ' ');
    // 删除“今日没有大事”这类与后一句重复的空开场，不裁掉人物真正说的内容。
    text = text.replace(/^今日(?:没有大事|没什么大事|无事)[。！？]\s*(?=[“"「])/, '');
    return text;
  }
  function chooseAuthored(person, category, topic) {
    try {
      if (typeof FICTION_INDEX === 'undefined' || typeof FICTION_DATA === 'undefined') return null;
      var cat = FICTION_DATA.categoryKeys.indexOf(category);
      var pi = MIND_VOICE[person.type] == null ? 0 : MIND_VOICE[person.type];
      var mood = activeMood(person);
      var mi = FICTION_DATA.states.findIndex(function (x) { return x.name === mood; });
      if (cat < 0 || mi < 0) return null;
      var key = [cat, pi, mi, topic].join('|');
      var rows = FICTION_INDEX.get(key) || [];
      if (!rows.length && topic === 'recent') rows = FICTION_INDEX.get([cat, pi, mi, 'default'].join('|')) || [];
      if (!rows.length) return null;

      var memory = mindOf(person);
      memory.used = memory.used || [];
      var available = rows.filter(function (line) { return memory.used.indexOf(line[0]) < 0; });
      var pool = available.length ? available : rows;
      var band = relationshipBand(person);
      var ranked = pool.map(function (line) {
        var reply = cleanAuthoredReply(line[5]);
        var score = 0;
        if (reply.length >= 16 && reply.length <= 92) score += 3;
        else if (reply.length > 130) score -= 3;
        if (/[？?]/.test(reply) && category !== 'probe') score -= 1;
        if (/(我有话想同您说|您若还想问|我愿意慢慢说|今日没有大事)/.test(reply)) score -= 3;
        score += topicRelevanceScore(reply, category, topic);
        score += relationTonePenalty(reply, band);
        if (/(你说得对|我明白|好的|好吧|遵命)[。！]?/.test(reply) && reply.length < 18) score -= 2;
        return { line: line, reply: reply, score: score };
      });
      ranked.sort(function (a, b) { return b.score - a.score; });
      var bestScore = ranked[0] ? ranked[0].score : -99;
      var best = ranked.filter(function (x) { return x.score >= bestScore - 1; });
      var index = hash(person.id + '|' + category + '|' + topic + '|' + todayKey() + '|' + memory.used.length) % best.length;
      var selected = best[index] || ranked[0];
      if (!selected || !selected.reply) return null;
      memory.used.push(selected.line[0]);
      memory.used = memory.used.slice(-80);
      auditCounts.authored++;
      var scene = FICTION_DATA.scenes[selected.line[1]] || {};
      return {
        id: selected.line[0],
        stage: sceneLine(person, category, topic),
        reply: selected.reply,
        player: topicPrompt(category, topic, scene),
        location: scene.location || person.location || person.home || '宫中',
        scene: {
          player: topicPrompt(category, topic, scene),
          location: scene.location || person.location || person.home || '宫中'
        },
        source: 'authored-topic'
      };
    } catch (error) {
      console.warn('[凤阙长歌 V10] 读取原对白库失败，转入人物内容兜底。', error);
      return null;
    }
  }
  function chooseSpecial(person, category, topic) {
    var row = SPECIAL_LINES[person.id] && SPECIAL_LINES[person.id][category + '|' + topic];
    if (!row || !row.length) return null;
    var memory = mindOf(person);
    memory.dialogueCursor = memory.dialogueCursor || {};
    var key = 'v10:' + category + ':' + topic;
    var cursor = Number(memory.dialogueCursor[key] || 0);
    var selected = row[cursor % row.length];
    return {
      id: 'V10-' + person.id + '-' + category + '-' + topic + '-' + cursor,
      stage: sceneLine(person, category, topic),
      reply: selected,
      player: topicPrompt(category, topic),
      location: person.location || person.home || '宫中',
      scene: {
        player: topicPrompt(category, topic),
        location: person.location || person.home || '宫中'
      },
      source: 'character-specific',
      _v10Cursor: { key: key, value: cursor }
    };
  }
  function hasAuthored(person, category, topic) {
    try {
      if (typeof FICTION_INDEX === 'undefined' || typeof FICTION_DATA === 'undefined') return false;
      var cat = FICTION_DATA.categoryKeys.indexOf(category);
      var pi = MIND_VOICE[person.type] == null ? 0 : MIND_VOICE[person.type];
      var mi = FICTION_DATA.states.findIndex(function (x) { return x.name === activeMood(person); });
      return cat >= 0 && mi >= 0 && (FICTION_INDEX.get([cat, pi, mi, topic].join('|')) || []).length > 0;
    } catch (_) { return false; }
  }
  function dailyDetail(person) {
    var relation = state.relations[person.id] || {};
    var profile = profileOf(person);
    var text = safeText(relation.agency && relation.agency.plan);
    if (!text) {
      try {
        var moments = state.agency && state.agency.moments || [];
        var moment = moments.slice().reverse().find(function (x) { return x.npc === person.id; });
        if (moment) text = safeText(moment.text);
      } catch (_) {}
    }
    if (!text && profile) text = safeText(profile.daily);
    if (!text && profile) text = safeText(profile.habit);
    if (text.indexOf(person.name) === 0) text = text.slice(person.name.length);
    text = text.replace(/^[，、：:\s]+/, '').replace(/^[他她]?(?:今日|近日|近来)/, '');
    return text;
  }
  function voiceFallback(person, category, topic) {
    var profile = profileOf(person);
    var band = relationshipBand(person);
    var type = person.type || '温柔体贴';
    var rule = VOICE_RULES[type] || VOICE_RULES['温柔体贴'];
    var detail = dailyDetail(person);
    var specialty = safeText(profile && profile.specialty || person.specialty || person.role || '手边的事务');
    var line = '';

    if (category === 'chat' && topic === 'recent') {
      if (detail) {
        if (type === '寡言重诺' || type === '清冷克制') line = '近来主要在忙这件事：' + detail;
        else if (type === '务实重利' || type === '野心进取') line = '这几日都在处理' + detail + '，做完还得再核一遍。';
        else if (type === '明朗直率' || type === '疏朗洒脱') line = '最近没闲着，' + detail + '。';
        else line = '近来多在忙' + detail + '。手头这件事办完，才算能松口气。';
      } else line = '近来照常当值，手头的差事不算少。';
    } else if (category === 'chat' && topic === 'home') {
      var clan = safeText(profile && profile.clan);
      if (profile && profile.bio) {
        if (band === 'formal') line = '家中旧事说来不短。陛下若只是问候，我可以答一句：家里都还安稳。';
        else line = '我出身' + (clan || '寻常人家') + '。家里的事有时比公事难理，近来正好有封信要回。';
      } else line = '家里一切如常。偶尔收到家书，才想起自己也该回去看看。';
    } else if (category === 'chat' && topic === 'interest') {
      var habit = safeText(profile && profile.habit);
      if (specialty) line = '闲时还是会做些熟悉的事，譬如' + specialty + '。' + (band === 'formal' ? '其余爱好，日后熟了再讲。' : habit ? '最近还在做一件小事：' + habit : '不忙的时候，也想留半日给自己。');
      else line = '闲下来时喜欢读书、散步，或找些不必赶时间的事做。';
    } else if (category === 'care' && (topic === 'listen' || topic === 'comfort')) {
      var mood = activeMood(person);
      if (['恼怒', '失望', '委屈'].indexOf(mood) >= 0) line = band === 'strained' ? '今日不想说场面话。事情还没过去，等我想清楚了再同您谈。' : '有件事还没理清。您既然问了，我便不说无事，只是今日还讲不完整。';
      else if (detail) line = '近来确实忙了些。' + detail + '，等手边的事办妥，我会歇一歇。';
      else line = '没什么大碍，只是这几日事情多了些。等忙完这一阵，我会好好歇着。';
    } else if (category === 'care' && topic === 'gift') {
      line = band === 'formal' ? '多谢陛下。礼物我会收好。' : '这份心意我收下了。下回不必特意破费，记得有空来坐坐便好。';
    } else if (category === 'care' && topic === 'bag') {
      line = '出门还记得替我留一份，多谢。我会收好。';
    } else if (category === 'care' && topic === 'promise') {
      line = band === 'strained' ? '日子先记下。若有变动，请提前告诉我，不要再让我空等。' : '好，下月这日我会空出来。若临时有事，也请让人给我个准信。';
    } else if (category === 'persuade' && topic === 'support') {
      line = type === '戒备善谋' ? '先把完整的章程给我看。只听一面之词，我不会替谁作保。' : '先把要担的责任、能调动的人手和期限说清，我再答应。';
    } else if (category === 'persuade' && topic === 'work') {
      line = type === '务实重利' ? '差事可以谈。期限、人手和酬劳先列清楚，免得日后各说各话。' : '把要办的事说清楚。若在我能力之内，我会给您一个准话。';
    } else if (category === 'persuade' && topic === 'reconcile') {
      line = '我可以去谈，但不保证一见面就能和好。先把误会说清，再看往后怎么相处。';
    } else if (category === 'probe' && topic === 'opinion') {
      line = type === '戒备善谋' ? '陛下今日为何问这个？若是想听真话，也请先说您真正想知道什么。' : '若要听真话，我便不说场面话。我做得好的地方，愿意继续做；做得不好的，也请指出来。';
    } else if (category === 'probe' && topic === 'worry') {
      line = band === 'formal' ? '有些事还不便说。等查清了，我会亲自回禀。' : '有一件事还没想好。等理清了再同您说，免得只说一半。';
    } else if (category === 'scold') {
      line = type === '严正守礼' ? '若是我的错，我认。只是请把哪一步失了规矩说清，我好改。' : type === '明朗直率' ? '有错我认，但也请让我把经过说完，不能只听旁人一句话。' : '若是我的错，我会改。只是事情的经过，也请容我解释清楚。';
    } else if (category === 'activity' && topic === 'chess') {
      line = type === '寡言重诺' ? '好。棋盘拿来。' : '好。今日认真下一局，不必让子，输赢都算数。';
    } else if (category === 'activity' && topic === 'walk') {
      line = type === '清冷克制' ? '可以。走一段便回，手头还有事要处理。' : '走吧。今日不谈折子，沿着廊下走一圈再说。';
    } else if (category === 'activity' && topic === 'spar') {
      line = type === '明朗直率' || type === '野心进取' ? '来吧。今日不让着您，先从基本招式练起。' : '可以。先把护腕系好，别急着比输赢。';
    } else if (category === 'flirt' && topic === 'compliment') {
      line = type === '骄矜自尊' ? '这句我收下了。不过我更想知道，您欣赏的究竟是哪一点。' : type === '疏朗洒脱' ? '今日这话倒好听。再说两句，我也不嫌多。' : '这句我记下了。只是陛下别只在今日这样说。';
    } else if (category === 'flirt' && topic === 'miss') {
      line = band === 'intimate' ? '会。只是怕您忙，才没总让人递话。' : '偶尔会想起。只是宫里事情多，我不敢拿这点念头来打扰您。';
    } else if (category === 'flirt' && topic === 'confess') {
      line = band === 'intimate' ? '我愿意认真考虑。只是这句话说出口，就不该再拿玩笑收回。' : '我听明白了。给我一点时间，想清楚后会亲口答复。';
    } else if (category === 'sleep' && topic === 'ask') {
      line = '今夜若要留下，先把话说清楚。我愿意与否，会亲口告诉您。';
    } else {
      line = '这件事我记下了。若有了准信，会亲自告诉陛下。';
    }
    return {
      id: 'V10-FALLBACK-' + person.id + '-' + category + '-' + topic + '-' + hash(todayKey() + person.id),
      stage: sceneLine(person, category, topic),
      reply: line,
      player: topicPrompt(category, topic),
      location: person.location || person.home || '宫中',
      scene: { player: topicPrompt(category, topic), location: person.location || person.home || '宫中' },
      source: 'voice-fallback',
      voiceRule: rule.strategy
    };
  }
  function makeRow(person, category, topic) {
    if (!person || !category || !topic) return null;
    var normalized = normalizeTopic(topic);
    var key = [person.id, category, normalized, activeMood(person), relationshipBand(person)].join('|');
    if (topicCache.has(key)) return topicCache.get(key);

    var special = chooseSpecial(person, category, normalized);
    var hasExact = hasAuthored(person, category, normalized);
    var useSpecial = !!special && (!hasExact || hash(key + '|special') % 3 === 0);
    var authored = useSpecial ? null : chooseAuthored(person, category, normalized);
    var row = null;
    // 核心人物的个人生活细节间隔出现；其余轮次优先用具体话题配表。
    if (useSpecial) {
      row = special;
      var specialMemory = mindOf(person);
      specialMemory.dialogueCursor = specialMemory.dialogueCursor || {};
      specialMemory.dialogueCursor[special._v10Cursor.key] = special._v10Cursor.value + 1;
      auditCounts.special++;
    } else if (authored) row = authored;
    else if (special) {
      row = special;
      var fallbackMemory = mindOf(person);
      fallbackMemory.dialogueCursor = fallbackMemory.dialogueCursor || {};
      fallbackMemory.dialogueCursor[special._v10Cursor.key] = special._v10Cursor.value + 1;
      auditCounts.special++;
    } else row = voiceFallback(person, category, normalized);

    row.reply = cleanAuthoredReply(row.reply);
    row.player = topicPrompt(category, normalized, row.scene);
    row.scene = row.scene || {};
    row.scene.player = row.player;
    row.scene.location = row.location;
    row.stage = sceneLine(person, category, normalized);
    row.v10 = {
      version: 'V10',
      category: category,
      topic: normalized,
      relationship: relationshipBand(person),
      mood: activeMood(person),
      source: row.source || 'authored-topic'
    };
    topicCache.set(key, row);
    lastDialogue = {
      id: row.id,
      personId: person.id,
      name: person.name,
      category: category,
      topic: normalized,
      relationship: row.v10.relationship,
      mood: row.v10.mood,
      source: row.v10.source,
      player: row.player,
      stage: row.stage,
      reply: row.reply
    };
    return row;
  }

  window.revisionRow = function (person, category) {
    var topic = person ? getCurrentTopic(person, category) : null;
    if (topic) {
      // 招入/晋封仍由原有专属弹窗与条件逻辑处理，避免普通对白覆盖选项说明。
      if (category === 'persuade' && (topic === 'recruit' || topic === 'promote')) {
        return oldRevisionRow.apply(this, arguments);
      }
      var row = makeRow(person, category, topic);
      if (row) return row;
    }
    return oldRevisionRow.apply(this, arguments);
  };

  window.readFiction = function (person, category, topic) {
    var requested = topic || (person ? getCurrentTopic(person, category) : null);
    if (person && category && requested) {
      var row = makeRow(person, category, normalizeTopic(requested));
      if (row) return row;
    }
    return oldReadFiction.apply(this, arguments);
  };

  // 包住最终的 action handler，确保具体话题贯穿取数、展示和记事三个环节。
  window.interactionTopic = function (topic) {
    activeTopic = normalizeTopic(topic);
    topicCache.clear();
    try {
      return oldInteractionTopic.apply(this, arguments);
    } finally {
      activeTopic = null;
    }
  };
  try { actions.interactionTopic = window.interactionTopic; } catch (_) {}

  // 每次拜访都重取“近况”，不复用上一轮的问候句。
  if (typeof oldVisit === 'function') {
    window.visit = function (personId) {
      activeTopic = 'recent';
      topicCache.clear();
      try { return oldVisit.apply(this, arguments); }
      finally { activeTopic = null; }
    };
    try { actions.visit = window.visit; } catch (_) {}
  }

  function sceneExchange(scene, source, target) {
    var kind = scene.kind || 'social';
    var a = NPC_SCENE_OPEN[source.type] || NPC_SCENE_OPEN['温柔体贴'];
    var b = NPC_SCENE_REPLY[target.type] || NPC_SCENE_REPLY['温柔体贴'];
    var c = NPC_SCENE_OPEN[target.type] || NPC_SCENE_OPEN['温柔体贴'];
    var d = NPC_SCENE_REPLY[source.type] || NPC_SCENE_REPLY['温柔体贴'];
    var seed = hash(scene.id || source.id + target.id);
    if (kind === 'reconcile') {
      return [
        { name: source.name, text: '上回那件事，我想过了。今日来，是想把各自的意思说清，不必再让旁人传话。' },
        { name: target.name, text: b[seed % b.length] },
        { name: source.name, text: '好。那就从当时的经过说起，不让旁人再替我们传话。' }
      ];
    }
    if (kind === 'disagree') {
      return [
        { name: source.name, text: a[seed % a.length] },
        { name: target.name, text: b[(seed + 1) % b.length] },
        { name: source.name, text: d[(seed + 1) % d.length] }
      ];
    }
    return [
      { name: source.name, text: '昨日那件事，我记着。今日得空，便来问一句办得如何。' },
      { name: target.name, text: c[(seed + 1) % c.length] }
    ];
  }
  function showAgencyScene(id) {
    if (!state.agency || !state.agency.scenes) return false;
    var scene = state.agency.scenes.find(function (x) { return x.id === id && !x.done; });
    if (!scene) return false;
    var source = PEOPLE.find(function (x) { return x.id === scene.source; });
    var target = PEOPLE.find(function (x) { return x.id === scene.target; });
    if (!source || !target) return false;
    var exchange = sceneExchange(scene, source, target);
    var body = '<div class="scene-text">' + escapeHtml(scene.text) + '</div>' +
      '<div class="v10-dialogue"><div class="v10-dialogue-title">廊下原话</div>' +
      exchange.map(function (line) {
        return '<div class="v10-line"><b>' + escapeHtml(line.name) + '</b><p>“' + escapeHtml(line.text) + '”</p></div>';
      }).join('') + '</div>' +
      '<div class="opts">' +
      '<button class="opt" data-action="agencyChoose" data-id="' + escapeHtml(id + '|listen') + '"><b>先听双方说法</b><small>不急着判谁对谁错。</small></button>' +
      '<button class="opt" data-action="agencyChoose" data-id="' + escapeHtml(id + '|call') + '"><b>把两人都叫来问</b><small>当面说清，可能有人觉得失了面子。</small></button>' +
      '<button class="opt" data-action="agencyChoose" data-id="' + escapeHtml(id + '|leave') + '"><b>暂不插手</b><small>让关系自行发展。</small></button></div>';
    openModal(scene.title, source.name + ' · ' + target.name, body, '人物往来 · 自主交流');
    auditCounts.scenes++;
    return true;
  }
  if (typeof oldAgencyOpen === 'function') {
    window.agencyOpen = function (id) {
      if (showAgencyScene(id)) return;
      return oldAgencyOpen.apply(this, arguments);
    };
    try { actions.agencyOpen = window.agencyOpen; } catch (_) {}
  }

  var style = document.createElement('style');
  style.textContent = '.v10-dialogue{margin:12px 0 4px;padding:14px 16px;border:1px solid #e6d4c9;border-radius:13px;background:#fffaf4}.v10-dialogue-title{font-size:12px;letter-spacing:2px;color:#a47768;margin-bottom:8px}.v10-line{padding:7px 0;border-top:1px solid #f0e6df}.v10-line:first-of-type{border-top:0}.v10-line b{font-size:12px;color:#9c6372}.v10-line p{margin:5px 0 0;line-height:1.8;font-size:14px;color:#4b3641}';
  document.head.appendChild(style);

  window.__FENGQUE_V10_PATCHED__ = true;
  window.__fengqueV10Audit = function () {
    return {
      version: 'V10',
      patched: !!window.__FENGQUE_V10_PATCHED__,
      rules: [
        '对白按具体话题、人物声线和当前关系阶段选择',
        '核心人物以个人习惯、专长与日常事务形成独有话题',
        '不强制告白、不把每段对话都写成暧昧戏',
        'NPC之间有自己的来往，玩家可以旁听或不插手',
        '不改关系数值、行动消耗、朝堂流程或事件条件'
      ],
      counts: Object.assign({}, auditCounts),
      last: lastDialogue
    };
  };
})();
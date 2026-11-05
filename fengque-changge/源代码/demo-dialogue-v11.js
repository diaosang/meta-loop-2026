/* 凤阙长歌 V12.1 · 女帝威仪、初见敬畏与世家殿选
 * 装载位置：demo-court-voice.js 之后。
 * 不修改关系数值、行动消耗、选秀年龄/周期/名额、本人拒绝机制及 NPC 自主行动。
 */
(function () {
  'use strict';
  if (window.__FENGQUE_IMPERIAL_TONE_V121__) return;

  var oldVisit = window.visit;
  var oldRenderSession = window.renderSession;
  var oldApplyInteraction = window.applyInteraction;
  var oldOpenModal = window.openModal;
  var oldAuditionInterview = window.auditionInterview;
  var oldAuditionPanel = window.auditionPanel;
  var oldMakeCandidate = window.makeCastCandidate;
  var oldCandidatePool = window.castCandidatePool;

  if (typeof oldVisit !== 'function' || typeof oldRenderSession !== 'function') {
    throw new Error('V12.1 未找到 V12 会面入口，停止接入。');
  }

  var audit = {
    firstMeetings: 0,
    scoldReplies: 0,
    disclosures: 0,
    applicants: 0,
    meritCards: 0,
    hiddenPlayerLines: 0
  };

  function str(value) { return String(value == null ? '' : value).trim(); }
  function hash(value) {
    var n = 2166136261, s = String(value);
    for (var i = 0; i < s.length; i++) {
      n ^= s.charCodeAt(i);
      n = Math.imul(n, 16777619);
    }
    return n >>> 0;
  }
  function personOf(id) {
    return (typeof PEOPLE !== 'undefined' ? PEOPLE : []).find(function (p) { return p.id === id; }) || null;
  }
  function profileOf(person) {
    if (!person) return null;
    var generated = state.cast && state.cast.generatedProfiles && state.cast.generatedProfiles[person.id];
    if (generated) return generated;
    try {
      return (CAST_DATA.profiles || []).find(function (p) { return p.id === person.id; }) || null;
    } catch (_) { return null; }
  }
  function relationOf(person) { return state.relations[person.id] || {}; }
  function moodOf(person) {
    try { return typeof currentMind === 'function' ? currentMind(person) : '平静'; }
    catch (_) { return '平静'; }
  }
  function relationBand(person) {
    var r = relationOf(person), mood = moodOf(person);
    if (['恼怒', '失望', '委屈', '疏离'].indexOf(mood) >= 0) return 'strained';
    if (Number(r.aff || 0) >= 72 && Number(r.love || 0) >= 35) return 'intimate';
    if (Number(r.aff || 0) >= 55 && Number(r.loyalty || 0) >= 55) return 'close';
    if (Number(r.aff || 0) >= 30) return 'familiar';
    return 'formal';
  }
  function selfTitle(person) {
    var r = relationOf(person);
    if (person.id === 'xie') return '奴才';
    if (person.official || r.recruited || person.id === 'xu' || person.id === 'jiang' || r.rank) return '臣';
    if (/女官|宫人|宫女/.test(person.role || '')) return '奴婢';
    return '草民';
  }
  function familyName(person) {
    var profile = profileOf(person);
    return str(profile && profile.clan || person.clan || person.faction || '世家');
  }
  function specialtyName(person) {
    var profile = profileOf(person);
    return str(profile && profile.specialty || person.specialty || '家学');
  }
  function specialtyLevel(person) {
    var profile = profileOf(person);
    return Number(profile && profile.specialtyLevel || person.specialtyLevel || 4);
  }
  function safeHtml(value) {
    return str(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function stripPlayerSpeech(value) {
    var text = String(value == null ? '' : value);
    var before = text;
    // 只移除主控的显式发言，不碰 NPC 的引语与场景动作。
    text = text.replace(/(?:<br\s*\/?>|\r?\n|\s)*(?:你说|你问|你向他|你请他|女帝问|陛下问|主控说|主控问)[：:]\s*[“「"][^”」"]*[”」"]/g, '');
    text = text.replace(/(?:<br\s*\/?>|\r?\n|\s)*(?:你说|你问|你向他|你请他|女帝问|陛下问|主控说|主控问)[：:]\s*[^<\r\n。！？]*[。！？]?/g, '');
    text = text.replace(/(?:<br\s*\/?>\s*){3,}/g, '<br><br>');
    if (text !== before) audit.hiddenPlayerLines++;
    return text;
  }

  var FIRST_ACTION = {
    '温柔体贴': '先向礼官确认了礼数，才走到御前行礼。',
    '清冷克制': '将手里的文书合起，依礼行礼，站定后才答话。',
    '明朗直率': '原想上前一步，见礼官示意，立刻收住脚步行礼。',
    '骄矜自尊': '理正衣襟，俯身行礼，答话时仍维持礼数。',
    '敏感多思': '把袖口收好，行礼后停了片刻才开口。',
    '圆融世故': '先向礼官确认礼数，随后上前行礼。',
    '严正守礼': '依礼行礼，站定后才回答，不敢抢先开口。',
    '野心进取': '双手奉上荐书，行礼后才抬头回话。',
    '疏朗洒脱': '收住方才的话头，整理衣冠后快步上前行礼。',
    '务实重利': '将名帖与荐书一并捧好，行礼后等候垂询。',
    '寡言重诺': '上前行礼，停了片刻，才低声回话。',
    '戒备善谋': '先看过殿中侍卫的位置，再依礼上前行礼。'
  };

  function firstMeeting(person) {
    var title = selfTitle(person);
    var family = familyName(person);
    var skill = specialtyName(person);
    if (person.id === 'xu') {
      return {
        stage: '许知衡将案上的奏折合起，向御前行礼时耳根微微泛红，很快便站直了。',
        reply: '臣正在核对北营粮册。三处数目已有眉目，只差最后一份签押。'
      };
    }
    var action = FIRST_ACTION[person.type] || FIRST_ACTION['清冷克制'];
    var stage = person.name + action;
    var reply;
    if (person.official || person.id === 'jiang') {
      reply = title + '现任' + str(person.role || '本职') + '，今日奉召入殿。陛下若有垂询，臣必据实回禀。';
    } else if (person.id === 'xie') {
      reply = '奴才奉召当值，手边的消息已按先后次序整理妥当。陛下若要查问，奴才不敢隐瞒。';
    } else {
      reply = title + '出身' + family + '，平日所习是' + skill + '。今日奉召前来，不敢在御前妄言。';
    }
    return { stage: stage, reply: reply };
  }

  // V12 的引擎把 prompt 存在 row.player；此处只改变展示，不修改事实、记忆或选项。
  window.renderSession = function () {
    if (typeof session === 'undefined' || !session) return oldRenderSession.apply(this, arguments);
    var message = session.message, response = session.response;
    session.message = stripPlayerSpeech(message);
    session.response = stripPlayerSpeech(response);
    try { return oldRenderSession.apply(this, arguments); }
    finally { session.message = message; session.response = response; }
  };

  // 首次会面：保留 V12 原来的行动消耗与 markContact，只替换初见呈现。
  window.visit = function (id) {
    var wasVisited = (state.visited || []).indexOf(id) >= 0;
    var person = personOf(id);
    var result = oldVisit.apply(this, arguments);
    if (!wasVisited && person && typeof session !== 'undefined' && session && session.id === id) {
      var opening = firstMeeting(person);
      session.message = opening.stage + '\n\n“' + opening.reply + '”';
      session.response = '';
      audit.firstMeetings++;
      if (typeof window.renderSession === 'function') window.renderSession();
      if (typeof save === 'function') save();
    }
    return result;
  };
  try { actions.visit = window.visit; } catch (_) {}

  var XU_SCOLD = {
    remind: '臣记下了。只是这份章程牵涉旧例，臣不敢为求快些便草率更改。',
    stern: '此事臣确有疏漏，愿担其责。但粮册中有一处签押并非臣经手，恳请陛下容臣查明再复。',
    public: '臣领训。只是案卷尚未齐备，若此时定论，恐会误伤无辜。'
  };
  var SCOLD_BY_TYPE = {
    '温柔体贴': '臣知错了。只是还想把事情经过说清，不愿让陛下因旁人的话误会。',
    '清冷克制': '臣领旨。请陛下指出需改之处，臣回去逐项核对。',
    '明朗直率': '臣认自己的错。不过事情经过还有一处，请容臣说明。',
    '骄矜自尊': '臣愿认错，但也请陛下听完缘由，再定臣的过失。',
    '敏感多思': '臣记住了。若有哪一步让陛下失望，请明示，臣不敢再猜。',
    '圆融世故': '臣明白。该担的责任不会推，只是此事还牵涉旁人，想请陛下容臣逐一核实。',
    '严正守礼': '臣领训。若是臣的失职，自当按章担责；若有误报，也请容臣查证。',
    '野心进取': '臣会改，也会把结果补上。只是此事还有一步未查完，请陛下给臣一个查清的机会。',
    '疏朗洒脱': '臣记下了。今日是臣失了分寸，往后会留意，不让陛下再费心。',
    '务实重利': '臣认账。只是责任与账目还没对齐，请陛下容臣把凭据一并呈上。',
    '寡言重诺': '臣记下了。该补的事，臣会办妥。',
    '戒备善谋': '臣听训。只是证据尚缺一环，臣不敢拿未核实的话回禀陛下。'
  };

  var LATE_DISCLOSURES = {
    xu: {
      'care|listen': [
        '幼时同窗时，陛下嫌臣写字慢。臣一直记得。后来每回入殿，听见脚步声，都会先抬头看一眼。',
        '臣以前总以为，把朝务办好便够了。后来才发觉，陛下不问折子的时候，臣反倒不知道该说什么。',
        '若今日只以许知衡的身份见您，而不是首辅，臣也想同您说些无关朝务的话。'
      ],
      'flirt|miss': [
        '会想。只是臣总以为，不去打扰陛下便是守分寸。如今倒不想每句话都拿分寸遮掩了。',
        '会。臣曾把想说的话写在折边，后来又一张张撕了。今日不想再撕。'
      ],
      'chat|interest': [
        '闲时仍会煮茶。只是近来煮得少了，怕茶刚沏好，陛下又被奏折叫走。',
        '臣喜欢旧书，也喜欢清静。若有一日不必议政，倒想请陛下去城南走走。'
      ]
    },
    jiang: {
      'care|listen': [
        '老臣曾怕陛下走得太快，后来才明白，做师长的不能替学生走完每一步。',
        '那张旧课业还留着。不是因为写得好，只是上头有陛下当年改过的字。'
      ],
      'chat|interest': [
        '近来仍在改讲义。只是如今会先把空白留出来，等陛下自己写下答案。',
        '老臣爱看旧书。若陛下得闲，书斋里还有几册先帝时的旧本。'
      ]
    },
    ye: {
      'care|listen': [
        '臣总把账算得清楚，唯独家里那几笔旧账，不知该从何处开口。',
        '那方旧帕子是家母留下的。旁人看不出值钱，臣却一直带着。'
      ],
      'flirt|miss': [
        '会想。只是臣习惯把想念也算进日程，忙起来便总往后挪。',
        '会。今日这趟没带账册，原是想留点时间给您。'
      ]
    },
    xie: {
      'care|listen': [
        '那家旧书铺关门以后，臣绕过去两回。今日才肯承认，臣惦记的未必只是书。',
        '臣习惯先查证再信人。可有些事不必再查，臣已经知道自己愿意来见您。'
      ],
      'flirt|miss': [
        '会。只是臣常把消息放在前头，把自己的事放在后头。今日想换一回。',
        '会想。若陛下不嫌臣话少，臣想把这句留在明处。'
      ]
    },
    song: {
      'care|listen': [
        '那支曲子其实早就能弹完。臣一直没交出去，是怕它只被当作一份邀赏。',
        '臣想让陛下听的，不是最难的那一段，是最后留白的地方。'
      ],
      'flirt|miss': [
        '会想。臣原想等曲子写完再来，后来觉得，想见您不该总等一个合适的收尾。',
        '会。今日没有新曲，只是想见您。'
      ]
    },
    lu: {
      'care|listen': [
        '臣不怕上阵，倒怕有句话没说好，陛下便转身走了。',
        '臣学做点心不是为了讨赏。只是想让陛下知道，臣不只有校场上的本事。'
      ],
      'flirt|miss': [
        '会啊。以前怕您忙，不敢来问。如今臣想先问一句，您今日可有空？',
        '会想。下回臣不在门外转圈了，先让人通报一声。'
      ]
    }
  };

  function specialReply(person, category, topic) {
    if (!person) return null;
    if (category === 'scold') {
      if (person.id === 'xu' && XU_SCOLD[topic]) return { text: XU_SCOLD[topic], kind: 'scold' };
      if (['remind', 'stern', 'public'].indexOf(topic) >= 0) {
        return { text: SCOLD_BY_TYPE[person.type] || SCOLD_BY_TYPE['清冷克制'], kind: 'scold' };
      }
    }
    // 许知衡的私心只在真正亲密时出现；其他核心人物也须先熟识。
    var band = relationBand(person);
    if (person.id === 'xu' && band !== 'intimate') return null;
    if (person.id !== 'xu' && band !== 'close' && band !== 'intimate') return null;
    if (['恼怒', '失望', '委屈', '疏离', '戒备'].indexOf(moodOf(person)) >= 0) return null;
    var pool = LATE_DISCLOSURES[person.id] && LATE_DISCLOSURES[person.id][category + '|' + topic];
    if (!pool || !pool.length) return null;
    var mind = relationOf(person).mind || (relationOf(person).mind = {});
    mind.dialogueCursor = mind.dialogueCursor || {};
    var cursorKey = 'v121:' + category + ':' + topic;
    var cursor = Number(mind.dialogueCursor[cursorKey] || 0);
    mind.dialogueCursor[cursorKey] = cursor + 1;
    audit.disclosures++;
    return { text: pool[cursor % pool.length], kind: 'disclosure' };
  }

  // applyInteraction 是 V12 的统一结算入口；先让原逻辑结算一次，再替换同一轮显示文本。
  if (typeof oldApplyInteraction === 'function') {
    window.applyInteraction = function (person, category, topic, line, effects, options) {
      var beforeLeft = typeof session !== 'undefined' && session ? session.left : null;
      var result = oldApplyInteraction.apply(this, arguments);
      if (!person || !session || session.id !== person.id || beforeLeft === null || session.left >= beforeLeft) return result;
      var special = specialReply(person, category, topic);
      if (!special) return result;
      session.response = '“' + special.text + '”';
      var mind = relationOf(person).mind;
      if (mind && mind.lastTurn) mind.lastTurn.reply = special.text;
      if (mind && Array.isArray(mind.turns) && mind.turns.length) mind.turns[mind.turns.length - 1].reply = special.text;
      if (state.logs && state.logs.length) {
        var logRow = state.logs[state.logs.length - 1];
        if (logRow && typeof logRow.text === 'string' && logRow.text.indexOf(person.name) >= 0) {
          logRow.text = person.name + '：' + special.text;
        }
      }
      if (special.kind === 'scold') audit.scoldReplies++;
      if (typeof window.renderSession === 'function') window.renderSession();
      if (typeof save === 'function') save();
      return result;
    };
  }

  function candidateMerit(person) {
    if (!person) return -1;
    var p = profileOf(person), skills = person.skills || {};
    var charm = Number(skills.charm || 0);
    var best = Math.max(Number(skills.admin || 0), Number(skills.literature || 0), Number(skills.military || 0));
    var level = Number(p && p.specialtyLevel || person.specialtyLevel || 4);
    return charm * 0.34 + best * 0.34 + level * 5 + (p && p.clan || person.faction ? 12 : 0);
  }
  function candidateFamily(person) {
    var p = profileOf(person), clan = str(p && p.clan || person.faction || '世家');
    var background = str(p && (p.background || p.bio) || person.background || '');
    var branch = /嫡支/.test(background) ? '嫡支' : /旁支/.test(background) ? '旁支' : '名门子弟';
    return clan + branch;
  }
  function candidateLooks(person) {
    var charm = Number(person.skills && person.skills.charm || 0);
    if (charm >= 82) return '姿容拔萃，风仪清贵';
    if (charm >= 70) return '清俊出众，仪态端方';
    if (charm >= 55) return '容貌端雅，气度不凡';
    return '眉目清秀，仪容整肃';
  }
  function candidateTalent(person) {
    var level = specialtyLevel(person);
    var rank = CAST_DATA.skillRanks && CAST_DATA.skillRanks[level - 1] || person.specialtyRank || '已有专长';
    var note = level >= 8 ? '一技名家' : level >= 6 ? '造诣颇深' : level >= 4 ? '专长已成' : '家学有长';
    return specialtyName(person) + ' · ' + rank + ' · ' + note;
  }
  function meritMarkup(person) {
    return '<div class="v121-merit"><span>家世 · ' + safeHtml(candidateFamily(person)) +
      '</span><span>风仪 · ' + safeHtml(candidateLooks(person)) +
      '</span><span>才艺 · ' + safeHtml(candidateTalent(person)) + '</span></div>';
  }

  // 生成候选者本来就是世家补录；让风仪、才学达到“可被荐入御前”的门槛。
  if (typeof oldMakeCandidate === 'function') {
    window.makeCastCandidate = function () {
      var person = oldMakeCandidate.apply(this, arguments);
      if (!person || String(person.id).indexOf('aud-') !== 0) return person;
      var seed = hash(person.id + ':imperial-merit-v121');
      person.skills = person.skills || {};
      person.skills.charm = Math.max(Number(person.skills.charm || 0), 72 + seed % 16);
      var keys = ['admin', 'literature', 'military'];
      var selected = keys[seed % keys.length];
      person.skills[selected] = Math.max(Number(person.skills[selected] || 0), 72 + (seed >>> 4) % 17);
      person.specialtyLevel = Math.max(Number(person.specialtyLevel || 0), 6 + (seed >>> 8) % 3);
      person.specialtyRank = CAST_DATA.skillRanks[person.specialtyLevel - 1] || '名家';
      var relation = state.relations[person.id];
      if (relation) {
        relation.skills = relation.skills || {};
        relation.skills.charm = person.skills.charm;
        relation.skills[selected] = person.skills[selected];
        relation.politics = relation.politics || person.skills.admin;
        relation.force = relation.force || person.skills.military;
      }
      var profile = state.cast && state.cast.generatedProfiles && state.cast.generatedProfiles[person.id];
      if (profile) {
        profile.specialtyLevel = person.specialtyLevel;
        profile.background = person.faction + '世家旁支，家中有荐书，凭风仪与一技之长入宫候选。';
        profile.bio = person.faction + '世家旁支，家学有传，风仪与专长经礼部核验。';
      }
      return person;
    };
  }
  if (typeof oldCandidatePool === 'function') {
    window.castCandidatePool = function () {
      var ids = oldCandidatePool.apply(this, arguments) || [];
      return ids.slice().sort(function (a, b) {
        return candidateMerit(personOf(b)) - candidateMerit(personOf(a));
      });
    };
  }

  function applicantStage(person, index) {
    var type = person.type || '清冷克制';
    if (index === 0) return person.name + '将荐书双手奉上，叩礼后才开口。';
    if (index === 1) return person.name + '把袖口收好，答话时仍垂首候命。';
    return person.name + '依礼再拜，停了片刻才回答留牌之事。';
  }
  function applicantAnswer(person, index, consent) {
    var family = candidateFamily(person), skill = specialtyName(person), self = '草民';
    var type = person.type || '清冷克制';
    if (index === 0) {
      if (['戒备善谋', '务实重利'].indexOf(type) >= 0) {
        return self + '出身' + family + '，家中荐书与谱牒皆已呈礼部。若陛下要核验，随时可查。草民不敢拿门第作凭，只求据实应答。';
      }
      if (['野心进取', '骄矜自尊'].indexOf(type) >= 0) {
        return self + '出身' + family + '，奉家中荐书入殿。家中盼草民得选，草民也想凭自己的本事求一个机会。';
      }
      return self + '出身' + family + '，今日奉荐书来应选。临行前家中长辈再三叮嘱，御前不得失仪，草民不敢有半句虚言。';
    }
    if (index === 1) {
      if (['野心进取', '明朗直率'].indexOf(type) >= 0) {
        return self + '所习是' + skill + '。口说未必可信，若陛下允准，草民愿当殿试艺。';
      }
      if (['敏感多思', '戒备善谋'].indexOf(type) >= 0) {
        return self + '所习是' + skill + '，师承与家学皆有凭据。今日御前回话，倒比平日练习更难，若有失误，恳请准草民重试。';
      }
      return self + '所习以' + skill + '稍长。若陛下要看，草民愿当殿试艺，不敢只凭口舌自陈。';
    }
    if (!consent) {
      return '请陛下恕罪。草民今日尚不能应下终身去处，愿自请撤牌，不敢虚占名额。';
    }
    if (type === '野心进取') {
      return '草民愿留牌。只求入宫以后，仍许草民研习' + skill + '，不致将从前所学都搁下。';
    }
    if (type === '骄矜自尊') {
      return '草民愿留。若蒙陛下留牌，自当珍重，不敢只凭门第自矜。';
    }
    if (type === '寡言重诺') {
      return '草民愿留。今日所答，往后亦不会改。';
    }
    if (type === '明朗直率') {
      return '草民愿意留下。宫中规矩，草民会认真学，不敢因一时得见天颜便忘了本分。';
    }
    return '草民愿留牌。宫中礼法森严，草民已听礼官讲过；未尽之处，入宫后自当细学。';
  }
  function writeApplicantAnswer(id, index, row, accepted) {
    var person = personOf(id);
    if (!person || !row) return;
    row.stage = applicantStage(person, index);
    row.reply = applicantAnswer(person, index, accepted);
    row.player = '';
    row.topic = String(index);
    row.semantic = 'audition-v121:' + id + ':' + index;
    var mind = relationOf(person).mind;
    if (mind) {
      if (mind.lastTurn) mind.lastTurn.reply = row.reply;
      if (Array.isArray(mind.turns) && mind.turns.length) {
        mind.turns[mind.turns.length - 1].reply = row.reply;
        mind.turns[mind.turns.length - 1].semantic = row.semantic;
      }
    }
    lastApplicant = { id: id, name: person.name, index: index, accepted: accepted, reply: row.reply };
    audit.applicants++;
  }

  // 宫门问话只显示 NPC 的答复，不显示玩家选择背后的原句。
  if (typeof oldOpenModal === 'function') {
    window.openModal = function (title, subtitle, body, eyebrow) {
      return oldOpenModal.call(this, title, subtitle, stripPlayerSpeech(body), eyebrow);
    };
  }

  function applicantIntro(person) {
    var profile = profileOf(person), clan = candidateFamily(person), skill = specialtyName(person);
    return '<span class="mind-stage">' + safeHtml(person.name) + '听见宣召，先俯身行礼。答话时声音略紧，仍努力把每个字说清。</span><br><br>“草民出身' +
      safeHtml(clan) + '，平日所习是' + safeHtml(skill) + '。今日得见陛下，不敢失礼。”';
  }
  function decorateApplicantCards() {
    var body = typeof $ === 'function' ? $('modalBody') : document.getElementById('modalBody');
    if (!body) return;
    var cards = body.querySelectorAll('.audition-grid .candidate');
    cards.forEach(function (card) {
      var button = card.querySelector('[data-action="auditionInterview"]');
      if (!button) return;
      var person = personOf(button.dataset.id);
      if (!person || card.querySelector('.v121-merit')) return;
      var host = card.children[1] || card;
      var anchor = host.querySelector('p');
      if (anchor) anchor.insertAdjacentHTML('afterend', meritMarkup(person));
      else host.insertAdjacentHTML('beforeend', meritMarkup(person));
      audit.meritCards++;
    });
  }

  if (typeof oldAuditionPanel === 'function') {
    window.auditionPanel = function () {
      if (state.audition && Array.isArray(state.audition.pool)) {
        state.audition.pool.sort(function (a, b) {
          return candidateMerit(personOf(b)) - candidateMerit(personOf(a));
        });
      }
      var result = oldAuditionPanel.apply(this, arguments);
      decorateApplicantCards();
      return result;
    };
  }

  if (typeof oldAuditionInterview === 'function') {
    window.auditionInterview = function (id) {
      var result = oldAuditionInterview.apply(this, arguments);
      var body = typeof $ === 'function' ? $('modalBody') : document.getElementById('modalBody');
      var person = personOf(id);
      if (body && person) {
        var scene = body.querySelector('.scene-text');
        var answer = state.audition && state.audition.answers && state.audition.answers[id];
        if (scene && !answer) scene.innerHTML = applicantIntro(person);
        var host = body.querySelector('.scene-text');
        if (host && !body.querySelector('.v121-merit')) {
          host.insertAdjacentHTML('afterend', meritMarkup(person));
          audit.meritCards++;
        }
      }
      lastApplicant = { id: id, name: person && person.name, opened: true };
      return result;
    };
  }

  // 由 V12 原选项处理资格、拒绝、记忆与轮次；本层只重写候选人的答复。
  if (typeof actions !== 'undefined' && typeof actions.auditionAsk === 'function') {
    var oldAuditionAsk = actions.auditionAsk;
    actions.auditionAsk = function (raw) {
      var parts = String(raw).split('|');
      var id = parts[0], index = Number(parts[1]);
      var au = state.audition, person = personOf(id);
      if (!person || !au || au.status !== 'offered' || !au.pool.includes(id) ||
          [0, 1, 2].indexOf(index) < 0) return;
      var alreadyAsked = (au.interviews[id] || []).includes(index);
      var result = oldAuditionAsk.apply(this, arguments);
      if (alreadyAsked) return result;
      var row = au.answers && au.answers[id];
      var consent = index === 2 ? au.consent[id] === true : true;
      writeApplicantAnswer(id, index, row, consent);
      if (typeof window.auditionInterview === 'function') window.auditionInterview(id);
      if (typeof save === 'function') save();
      return result;
    };
  }

  var style = document.createElement('style');
  style.textContent = '.v121-merit{display:flex;flex-direction:column;gap:3px;margin:8px 0;padding:8px 10px;border-left:2px solid #b78c70;background:#faf2eb;color:#80616a;font-size:11px;line-height:1.6}.v121-merit span{display:block}.audition-grid .candidate .v121-merit{max-width:100%}';
  document.head.appendChild(style);

  window.__FENGQUE_IMPERIAL_TONE_V121__ = true;
  window.__fengqueImperialToneAudit = function () {
    return {
      version: 'V12.1',
      patched: !!window.__FENGQUE_IMPERIAL_TONE_V121__,
      rules: [
        '初见先守礼；许知衡初见耳根泛红，回答朝务一至两句',
        '数落只显示 NPC 的一段回应；许知衡保留责任与证据立场',
        '许知衡只在真正亲密时逐步敞开心意',
        'NPC 对话框与选秀问话不显示主控原句',
        '候选人展示家世、风仪、专长；御前回答谨慎敬畏',
        '原选秀资格、年龄范围、留牌人数、资源、拒绝机制与关系数值保留'
      ],
      counts: Object.assign({}, audit),
      lastApplicant: lastApplicant
    };
  };
})();
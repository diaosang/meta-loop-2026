/* 凤阙长歌 V11 · 女帝威仪、初见敬畏与选秀世家感
 * 不改行动、好感、忠诚、暧昧、年龄门槛、留牌数量或选秀周期。
 * 只调整初见表现、人物回答、对话展示和选秀人物的资质呈现。
 */
(function () {
  'use strict';
  if (window.__FENGQUE_V11_PATCHED__) return;

  var oldVisit = window.visit;
  var oldRenderSession = window.renderSession;
  var oldInteractionTopic = window.interactionTopic;
  var oldAuditionPanel = window.auditionPanel;
  var oldAuditionInterview = window.auditionInterview;
  var oldAuditionLine = window.expansionAuditionLine;
  var oldCandidatePool = window.castCandidatePool;
  var oldMakeCandidate = window.makeCastCandidate;
  var oldOpenModal = window.openModal;

  if (typeof oldVisit !== 'function' || typeof oldRenderSession !== 'function') {
    throw new Error('V11 未找到人物会面入口，已停止加载。');
  }

  var activeTopic = null;
  var lastFirstMeeting = null;
  var lastApplicant = null;
  var audit = { firstMeetings: 0, scoldReplies: 0, disclosures: 0, applicantCards: 0, applicants: 0 };

  function text(value) { return String(value == null ? '' : value).trim(); }
  function hash(value) {
    var n = 2166136261, s = String(value);
    for (var i = 0; i < s.length; i++) { n ^= s.charCodeAt(i); n = Math.imul(n, 16777619); }
    return n >>> 0;
  }
  function personOf(id) {
    return (typeof PEOPLE !== 'undefined' && PEOPLE || []).find(function (p) { return p.id === id; }) || null;
  }
  function profileOf(person) {
    try {
      var generated = state.cast && state.cast.generatedProfiles && state.cast.generatedProfiles[person.id];
      if (generated) return generated;
      return (CAST_DATA && CAST_DATA.profiles || []).find(function (p) { return p.id === person.id; }) || null;
    } catch (_) { return null; }
  }
  function relationOf(person) { return state.relations[person.id] || {}; }
  function mindOf(person) { var r = relationOf(person); return r.mind || (r.mind = { memories: [], used: [], dialogueCursor: {} }); }
  function currentMood(person) {
    try { return typeof currentMind === 'function' ? currentMind(person) : '平静'; }
    catch (_) { return '平静'; }
  }
  function relationBand(person) {
    var r = relationOf(person), mood = currentMood(person);
    if (['恼怒', '失望', '委屈', '疏离'].indexOf(mood) >= 0) return 'strained';
    if (Number(r.aff || 0) >= 72 && Number(r.love || 0) >= 35) return 'intimate';
    if (Number(r.aff || 0) >= 55 && Number(r.loyalty || 0) >= 55) return 'close';
    if (Number(r.aff || 0) >= 30) return 'familiar';
    return 'formal';
  }
  function isFirstMeeting(id) {
    return !(state.visited || []).includes(id);
  }

  var FIRST_ACTION = {
    '温柔体贴': '先行礼，将手边的东西放好，答话放得很轻。',
    '清冷克制': '将手中书卷合起，依礼行礼，才抬头回话。',
    '明朗直率': '原想上前一步，见礼官示意，立刻收住脚步行礼。',
    '骄矜自尊': '将衣襟理正，俯身行礼，答话仍不失分寸。',
    '敏感多思': '指尖扣住袖口，行礼后才开口。',
    '圆融世故': '先向礼官确认礼数，随后上前行礼。',
    '严正守礼': '依礼行礼，站定后才回答，不敢抢先开口。',
    '野心进取': '双手奉上荐书，行礼后将准备好的话压成简短两句。',
    '疏朗洒脱': '听见宣召便收了闲谈，整理衣冠后快步上前行礼。',
    '务实重利': '把荐书与名帖一并捧好，行礼后等候垂询。',
    '寡言重诺': '上前行礼，停了片刻，才低声回话。',
    '戒备善谋': '先看过殿中侍卫的位置，再依礼上前行礼。'
  };

  function firstMeetingDialogue(person) {
    var p = profileOf(person), family = text(p && p.clan || person.clan || person.faction);
    var role = text(person.role || p && p.background || '本职差事');
    var specialty = text(p && p.specialty || person.specialty || '所习之业');
    if (person.id === 'xu') {
      return {
        stage: '许知衡将案上的奏折合起，行礼时耳根微微泛红，很快便站直了。',
        reply: '臣方才在核对北营粮册。三处数目已有眉目，只差最后一份签押。'
      };
    }
    var action = FIRST_ACTION[person.type] || FIRST_ACTION['清冷克制'];
    var stage = person.name + action;
    var reply;
    if (person.official) {
      reply = '臣现任' + role + '，今日奉召入殿。陛下若有垂询，臣必据实回禀。';
    } else {
      reply = '臣出身' + (family || '世家') + '，平日所习是' + specialty + '。今日奉召前来，不敢在御前妄言。';
    }
    return { stage: stage, reply: reply };
  }

  function sanitizeControllerLines(value) {
    var input = String(value == null ? '' : value);
    var parts = input.split(/(<br\s*\/?>|\r?\n)/i);
    var output = [];
    for (var i = 0; i < parts.length; i++) {
      var part = parts[i];
      if (/^<br\s*\/?>$/i.test(part) || /^\r?\n$/.test(part)) {
        output.push(part);
        continue;
      }
      var plain = part.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
      if (/^(?:你问|你向他|你请他|你把|你向|女帝问|陛下问|主控说|主控问)/.test(plain)) continue;
      output.push(part);
    }
    return output.join('').replace(/(?:<br\s*\/?>|\s)*$/i, '');
  }

  // 主控的台词不进入对话框；只展示 NPC 的动作与回应。
  window.renderSession = function () {
    if (typeof session === 'undefined' || !session) return oldRenderSession.apply(this, arguments);
    var oldMessage = session.message, oldResponse = session.response;
    session.message = sanitizeControllerLines(oldMessage);
    session.response = sanitizeControllerLines(oldResponse);
    try { return oldRenderSession.apply(this, arguments); }
    finally { session.message = oldMessage; session.response = oldResponse; }
  };

  // 初见先建立身份距离。只对首次会面生效，不会覆盖后续关系发展。
  if (typeof oldVisit === 'function') {
    window.visit = function (id) {
      var first = isFirstMeeting(id), person = personOf(id);
      var result = oldVisit.apply(this, arguments);
      if (first && person && typeof session !== 'undefined' && session && session.id === id) {
        var opening = firstMeetingDialogue(person);
        session.message = opening.stage + '\n\n“' + opening.reply + '”';
        session.response = '';
        lastFirstMeeting = { id: id, name: person.name, stage: opening.stage, reply: opening.reply };
        audit.firstMeetings++;
        if (typeof renderSession === 'function') renderSession();
        if (typeof save === 'function') save();
      }
      return result;
    };
  }

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

  function customReply(person, category, topic) {
    if (!person) return null;
    var key = category + '|' + topic;
    if (category === 'scold') {
      if (person.id === 'xu' && XU_SCOLD[topic]) return { reply: XU_SCOLD[topic], kind: 'scold' };
      if (['remind', 'stern', 'public'].indexOf(topic) >= 0) {
        return { reply: SCOLD_BY_TYPE[person.type] || SCOLD_BY_TYPE['清冷克制'], kind: 'scold' };
      }
    }
    if (['恼怒', '失望', '委屈', '疏离'].indexOf(currentMood(person)) >= 0) return null;
    var band = relationBand(person);
    if (band !== 'close' && band !== 'intimate') return null;
    var pool = LATE_DISCLOSURES[person.id] && LATE_DISCLOSURES[person.id][key];
    if (!pool || !pool.length) return null;
    if (band === 'intimate' && person.id === 'xu' && (category === 'care' || category === 'flirt')) {
      // 许知衡到了真正亲近的阶段，才会把同窗旧事和个人心意说出来。
    }
    var mind = mindOf(person);
    mind.dialogueCursor = mind.dialogueCursor || {};
    var cursorKey = 'v11-disclosure:' + key;
    var cursor = Number(mind.dialogueCursor[cursorKey] || 0);
    mind.dialogueCursor[cursorKey] = cursor + 1;
    audit.disclosures++;
    return { reply: pool[cursor % pool.length], kind: 'disclosure' };
  }

  // 被数落时只给一段简短、明确的答复；关系足够亲近后才开放私密话题。
  if (typeof oldInteractionTopic === 'function') {
    window.interactionTopic = function (topic) {
      activeTopic = text(topic || 'recent').replace(/^relation:/, 'opinion').replace(/^exclusive:/, 'recent');
      var person = typeof session !== 'undefined' && session ? personOf(session.id) : null;
      var category = typeof session !== 'undefined' && session ? session.section : null;
      var before = typeof session !== 'undefined' && session && session.history ? session.history.length : 0;
      var result = oldInteractionTopic.apply(this, arguments);
      if (person && session && session.id === person.id && session.history && session.history.length > before) {
        var special = customReply(person, category, activeTopic);
        if (special) {
          session.response = '“' + special.reply + '”';
          if (state.logs && state.logs.length) {
            var logRow = state.logs[state.logs.length - 1];
            if (logRow && typeof logRow.text === 'string' && logRow.text.indexOf(person.name) >= 0) {
              logRow.text = person.name + '：' + special.reply;
            }
          }
          if (special.kind === 'scold') audit.scoldReplies++;
          if (typeof renderSession === 'function') renderSession();
          if (typeof save === 'function') save();
        }
      }
      activeTopic = null;
      return result;
    };
    try { actions.interactionTopic = window.interactionTopic; } catch (_) {}
  }

  function applicantFamily(person) {
    var p = profileOf(person), clan = text(p && p.clan || person.faction || person.clan || '世家');
    var background = text(p && (p.background || p.bio) || person.background || '');
    var branch = /嫡支/.test(background) ? '嫡支' : /旁支/.test(background) ? '旁支' : '名门子弟';
    return clan + branch;
  }
  function applicantAppearance(person) {
    var charm = Number(person.skills && person.skills.charm || 0);
    if (charm >= 82) return '姿容拔萃，风仪清贵';
    if (charm >= 70) return '清俊出众，仪态端方';
    if (charm >= 55) return '容貌端雅，气度不凡';
    return '眉目清秀，仪容整肃';
  }
  function applicantTalent(person) {
    var p = profileOf(person), specialty = text(p && p.specialty || person.specialty || '家学');
    var level = Number(p && p.specialtyLevel || person.specialtyLevel || 4);
    var rank = (typeof CAST_DATA !== 'undefined' && CAST_DATA.skillRanks && CAST_DATA.skillRanks[level - 1]) || person.specialtyRank || '已有专长';
    var description = level >= 8 ? '一技名家' : level >= 6 ? '造诣颇深' : level >= 4 ? '专长已成' : '家学有长';
    return specialty + ' · ' + (rank || description) + ' · ' + description;
  }
  function meritScore(person) {
    var skills = person.skills || {};
    var best = Math.max(Number(skills.admin || 0), Number(skills.literature || 0), Number(skills.military || 0));
    var charm = Number(skills.charm || 0);
    var p = profileOf(person), level = Number(p && p.specialtyLevel || person.specialtyLevel || 4);
    var clan = text(p && p.clan || person.faction || '');
    var familyScore = clan ? 12 : 0;
    return charm * 0.34 + best * 0.34 + level * 5 + familyScore;
  }
  function applicantCredentialHtml(person) {
    var family = applicantFamily(person);
    var looks = applicantAppearance(person);
    var talent = applicantTalent(person);
    return '<div class="v11-merit"><span>家世 · ' + escapeText(family) + '</span><span>风仪 · ' + escapeText(looks) + '</span><span>才艺 · ' + escapeText(talent) + '</span></div>';
  }
  function escapeText(value) {
    return text(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // 新生成的应选者来自世家荐选，风仪和专长需配得上入殿候选的身份。
  if (typeof oldMakeCandidate === 'function') {
    window.makeCastCandidate = function (slot) {
      var person = oldMakeCandidate.apply(this, arguments);
      if (person && String(person.id).indexOf('aud-') === 0) {
        person.skills = person.skills || {};
        var meritSeed = hash(person.id + ':v11');
        person.skills.charm = Math.max(Number(person.skills.charm || 0), 70 + (meritSeed % 16));
        person.specialtyLevel = Math.max(Number(person.specialtyLevel || 0), 6 + (meritSeed % 3));
        person.specialtyRank = CAST_DATA.skillRanks[person.specialtyLevel - 1] || '名家';
        var relation = state.relations[person.id];
        if (relation) {
          relation.skills = relation.skills || {};
          relation.skills.charm = person.skills.charm;
        }
        var profile = state.cast && state.cast.generatedProfiles && state.cast.generatedProfiles[person.id];
        if (profile) {
          profile.specialtyLevel = person.specialtyLevel;
          profile.background = person.faction + '世家旁支，凭家学与专长入选，随荐书入宫候试。';
          profile.bio = person.faction + '世家旁支，家学有传，风仪与专长皆经礼部核验。';
        }
      }
      return person;
    };
  }

  // 选秀名单按家世、风仪、专长综合排序；保留原有候选资格与人数。
  if (typeof oldCandidatePool === 'function') {
    window.castCandidatePool = function () {
      var paired = new Set((CAST_DATA.marriages || []).filter(function (x) { return x.status === 'married'; })
        .reduce(function (all, x) { return all.concat([x.a, x.b]); }, []));
      var pool = (PEOPLE || []).filter(function (p) {
        var age = typeof castAge === 'function' ? castAge(p) : Number(p.age || 0);
        return !p.official && p.id !== 'xie' && age >= 16 && age <= 25 &&
          p.romance && p.gender !== '宦官' && !paired.has(p.id) &&
          !(state.relations[p.id] && state.relations[p.id].rank);
      });
      pool.sort(function (a, b) {
        var diff = meritScore(b) - meritScore(a);
        return diff || hash(state.elapsed + ':' + a.id) - hash(state.elapsed + ':' + b.id);
      });
      pool = pool.slice(0, 8);
      for (var i = 0; pool.length < 8 && i < 12; i++) {
        var candidate = window.makeCastCandidate ? window.makeCastCandidate(i) : null;
        if (candidate && !paired.has(candidate.id) &&
            !(state.relations[candidate.id] && state.relations[candidate.id].rank) &&
            !pool.some(function (x) { return x.id === candidate.id; })) pool.push(candidate);
      }
      pool.sort(function (a, b) { return meritScore(b) - meritScore(a); });
      if (typeof ensureMinds === 'function') ensureMinds();
      if (typeof ensureInteractionStats === 'function') ensureInteractionStats();
      return pool.slice(0, 8).map(function (p) { return p.id; });
    };
  }

  function applicantIntro(person) {
    var type = person.type || '清冷克制';
    var action = FIRST_ACTION[type] || FIRST_ACTION['清冷克制'];
    var family = applicantFamily(person);
    var specialty = applicantTalent(person);
    var reply = '臣出身' + family + '，家中荐臣前来应选。臣所习为' + specialty.split(' · ')[0] + '，不敢在陛下面前自夸。';
    return person.name + action + '\n\n“' + reply + '”';
  }
  function applicantAnswer(person, index) {
    var family = applicantFamily(person);
    var specialty = applicantTalent(person);
    var skill = specialty.split(' · ')[0];
    if (index === 0) {
      return '臣出身' + family + '，奉家中荐书入殿。今日得见陛下，臣不敢有半句虚言；若有失礼之处，还请陛下指正。';
    }
    if (index === 1) {
      return '臣所长是' + skill + '，师承与家学皆有凭据。若陛下允准，臣愿当殿试艺，不敢只凭口舌自陈。';
    }
    return '臣知道宫中规矩森严，也知道御前不可失仪。若蒙陛下留牌，臣必谨守本分；若不合圣意，臣领旨退下。';
  }

  // 替换扩展选秀对白：三轮问话皆谨慎、简短，先显门第与本事，再谈留宫。
  window.expansionAuditionLine = function (person, index) {
    return {
      id: 'V11-AUD-' + person.id + '-' + index,
      stage: applicantIntro(person),
      reply: applicantAnswer(person, index),
      player: '',
      location: person.location || '候选殿外',
      scene: { player: '', location: person.location || '候选殿外' }
    };
  };
  window.expansionAuditionBase = function (person, index) {
    return applicantAnswer(person, index);
  };

  function decorateApplicantCards() {
    if (typeof state === 'undefined' || !state.audition || state.audition.status !== 'offered') return;
    var body = typeof $ === 'function' ? $('modalBody') : document.getElementById('modalBody');
    if (!body) return;
    var cards = body.querySelectorAll('.audition-grid .candidate');
    cards.forEach(function (card) {
      var button = card.querySelector('[data-action="auditionInterview"]');
      if (!button) return;
      var person = personOf(button.dataset.id);
      if (!person || card.querySelector('.v11-merit')) return;
      var host = card.querySelector('.candidate-info') || card.children[1] || card;
      var anchor = host.querySelector('p');
      if (anchor) anchor.insertAdjacentHTML('afterend', applicantCredentialHtml(person));
      else host.insertAdjacentHTML('beforeend', applicantCredentialHtml(person));
      audit.applicantCards++;
    });
  }

  if (typeof oldAuditionPanel === 'function') {
    window.auditionPanel = function () {
      var result = oldAuditionPanel.apply(this, arguments);
      decorateApplicantCards();
      return result;
    };
  }

  function refreshAuditionQuestionLabels() {
    var body = typeof $ === 'function' ? $('modalBody') : document.getElementById('modalBody');
    if (!body) return;
    var labels = ['了解应选缘由', '询问家世与所长', '确认留宫意愿'];
    body.querySelectorAll('[data-action="auditionAsk"]').forEach(function (button) {
      var raw = text(button.dataset.id), index = Number(raw.split('|')[1]);
      var label = labels[index];
      var title = button.querySelector('b');
      if (label && title) title.textContent = label;
    });
  }

  if (typeof oldAuditionInterview === 'function') {
    window.auditionInterview = function (id, answer) {
      var result = oldAuditionInterview.apply(this, arguments);
      var body = typeof $ === 'function' ? $('modalBody') : document.getElementById('modalBody');
      if (body) {
        if (!answer) {
          var scene = body.querySelector('.scene-text');
          var person = personOf(id);
          if (scene && person) scene.textContent = applicantIntro(person);
        }
        refreshAuditionQuestionLabels();
      }
      lastApplicant = { id: id, name: personOf(id) && personOf(id).name, answer: text(answer || '') };
      return result;
    };
  }

  // 选秀开场强调御前威仪，谢无咎也按内廷礼数回禀。
  if (typeof oldOpenModal === 'function') {
    window.openModal = function (title, subtitle, body, eyebrow) {
      if (String(eyebrow || '').indexOf('自愿遴选') >= 0 || String(eyebrow || '').indexOf('选秀') >= 0) {
        subtitle = '谢无咎垂首回禀：“各家荐书已呈，应选者皆在殿外候命，请陛下阅看。”';
      }
      return oldOpenModal.call(this, title, subtitle, body, eyebrow);
    };
  }

  var style = document.createElement('style');
  style.textContent = '.v11-merit{display:flex;flex-direction:column;gap:3px;margin:7px 0 8px;padding:8px 9px;border-left:2px solid #b78c70;background:#faf2eb;color:#80616a;font-size:11px;line-height:1.6}.v11-merit span{display:block}.audition-grid .candidate{align-items:stretch}.audition-grid .candidate>div:last-child{min-width:0}.audition-grid .candidate .v11-merit{max-width:100%}';
  document.head.appendChild(style);

  window.__FENGQUE_V11_PATCHED__ = true;
  window.__fengqueV11Audit = function () {
    return {
      version: 'V11',
      patched: !!window.__FENGQUE_V11_PATCHED__,
      rules: [
        '初见先守礼、谨慎作答；许知衡初见有轻微脸红并严肃回应',
        '受数落时只给一段简短答复；亲近后才逐步开放私人心意',
        '对话框隐藏主控说的话，只展示 NPC 动作与回应',
        '选秀者展示家世、风仪、专长；御前问话保持敬畏与礼数',
        '保留原有选秀资格、留牌人数、年龄门槛、资源与关系数值'
      ],
      counts: Object.assign({}, audit),
      lastFirstMeeting: lastFirstMeeting,
      lastApplicant: lastApplicant
    };
  };
})();
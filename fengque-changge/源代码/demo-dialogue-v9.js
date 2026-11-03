/* 凤阙长歌 V9.1 · 话题优先的自然对话层
 * 只修正人物会面对白的取数与呈现；不改数值、行动消耗、事件触发或存档结构。
 */
(function () {
  'use strict';
  if (window.__FENGQUE_V9_PATCHED__) return;

  var oldRevisionRow = typeof window.revisionRow === 'function' ? window.revisionRow : null;
  var oldReadFiction = typeof window.readFiction === 'function' ? window.readFiction : null;
  var oldInteractionTopic = typeof window.interactionTopic === 'function' ? window.interactionTopic : null;
  if (!oldRevisionRow || !oldReadFiction || !oldInteractionTopic) {
    throw new Error('V9 对话层未找到原有对白入口，已停止接入，未修改游戏逻辑。');
  }

  var activeTopic = null;
  var cache = new Map();
  var lastRow = null;

  // 场景只呈现能被看见的动作，不替 NPC 描写心态或神态。
  var SCENES = {
    chat: {
      recent: '把手边的文书合上，给你腾出座位。',
      home: '将一封家书收好，请你坐下。',
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
      support: '把相关文书摊开，与你商量安排。',
      work: '取出手边的文书，等你说明差事。',
      reconcile: '将两人的往来记录放到桌上。',
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
      confess: '将旁边的人请退，留出单独说话的空当。',
      default: '停下手里的事，与你说话。'
    },
    sleep: {
      ask: '让宫人退到门外，等你先开口。',
      stay: '让宫人退到门外，与你一道歇下。',
      default: '让宫人退到门外。'
    }
  };

  function normalTopic(topic) {
    var value = String(topic || 'recent');
    if (value.indexOf('relation:') === 0) return 'opinion';
    if (value === 'stay') return 'ask';
    if (value.indexOf('exclusive:') === 0) return 'recent';
    return value;
  }

  function currentTopicFor(person, category) {
    if (activeTopic) return normalTopic(activeTopic);
    try {
      if (typeof state !== 'undefined' && state.agency && state.agency.currentTopic &&
          typeof session !== 'undefined' && session && session.id === person.id &&
          session.section === category) {
        return normalTopic(state.agency.currentTopic);
      }
    } catch (_) {}
    return null;
  }

  function sceneLine(person, category, topic) {
    var group = SCENES[category] || {};
    var action = group[topic] || group.default || '停下手里的事，与你说话。';
    return String(person && person.name || '他') + action;
  }

  // 长对白保留第一处完整落点，避免一轮回答塞入多个互不相干的交流目的。
  // 只按篇幅和句界处理，不按词语黑名单删句。
  function keepOnePurpose(reply) {
    var text = String(reply == null ? '' : reply).trim();
    if (!text) return text;
    var parts = text.match(/[^。！？]*[。！？]|[^。！？]+$/g) || [text];
    parts = parts.map(function (part) { return part.trim(); }).filter(Boolean);
    if (parts.length >= 3 || (text.length > 64 && parts.length > 1)) {
      return parts[0];
    }
    return text;
  }

  function makeTopicRow(person, category, topic) {
    try {
      var row = oldReadFiction(person, category, topic);
      if (!row || !row.reply) return null;
      var copy = Object.assign({}, row);
      copy.scene = Object.assign({}, row.scene || {});
      copy.player = row.player || copy.scene.player || '';
      copy.location = row.location || copy.scene.location ||
        person.location || person.home || person.birthplace || '宫中';
      copy.scene.player = copy.player;
      copy.scene.location = copy.location;
      copy.stage = sceneLine(person, category, topic);
      copy.reply = keepOnePurpose(row.reply);
      copy.v9 = {
        version: 'V9.1',
        category: category,
        topic: topic,
        sourceId: row.id || null,
        policy: 'topic-first / one-purpose / observable-scene'
      };
      lastRow = {
        person: person.name,
        personId: person.id,
        category: category,
        topic: topic,
        sourceId: row.id || null,
        player: copy.player,
        stage: copy.stage,
        reply: copy.reply
      };
      return copy;
    } catch (error) {
      console.warn('[凤阙长歌 V9] 话题对白读取失败，回退原对白。', error);
      return null;
    }
  }

  // 关键修复：旧版 revisionRow 只按 category 取文案，会覆盖玩家所选的具体 topic。
  // 现在处于互动上下文时，优先返回该 NPC、该类别、该话题的原始配表行。
  window.revisionRow = function (person, category) {
    var topic = person ? currentTopicFor(person, category) : null;
    if (topic && person && category) {
      var key = [person.id, category, topic].join('|');
      if (!cache.has(key)) cache.set(key, makeTopicRow(person, category, topic));
      var selected = cache.get(key);
      if (selected) return selected;
    }
    return oldRevisionRow.apply(this, arguments);
  };

  // 清理缓存只发生在玩家开始一条新话题时。同一轮互动中的“显示”和“记事”
  // 读取的是同一条对白，避免重复推进人物记忆游标。
  window.interactionTopic = function (topic) {
    cache.clear();
    activeTopic = normalTopic(topic);
    try {
      return oldInteractionTopic.apply(this, arguments);
    } finally {
      activeTopic = null;
    }
  };

  // 每次重新拜访都重新取一次“近况”话题，避免上一轮缓存让 NPC 原句复读。
  var oldVisit = typeof window.visit === 'function' ? window.visit : null;
  if (oldVisit) {
    window.visit = function (personId) {
      cache.clear();
      activeTopic = 'recent';
      try {
        return oldVisit.apply(this, arguments);
      } finally {
        activeTopic = null;
      }
    };
  }

  try {
    if (typeof actions !== 'undefined' && actions) {
      actions.interactionTopic = window.interactionTopic;
      if (window.visit) actions.visit = window.visit;
    }
  } catch (_) {}

  window.__FENGQUE_V9_PATCHED__ = true;
  window.__fengqueV9Audit = function () {
    return {
      version: 'V9.1',
      patched: !!window.__FENGQUE_V9_PATCHED__,
      rule: '先按具体话题取对白；不拼接心境补句；场景只用可观察动作；长对白限制为一个主要落点。',
      last: lastRow
    };
  };
})();

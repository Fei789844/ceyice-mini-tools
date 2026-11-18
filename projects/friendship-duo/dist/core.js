/* Shared, offline-only questionnaire and pair interpretation. No network calls. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Friendship = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const questions = [
    { title: '交朋友，你最看重什么？', hint: '先挑一件最在意的。', options: [
      ['有趣', '随便聊两句，就能笑出来。'], ['靠谱', '真有事，找得到人。'],
      ['真诚', '有意见当面说，不在背后传话。'], ['惦记', '自己没在，也有人想着自己。']
    ] },
    { title: '你能接受朋友多损？', hint: '不喜欢被损也很正常。', options: [
      ['尽管来', '你损我一句，我能回你两句。'], ['看场合', '私下随便闹，人多留点面子。'], ['轻一点', '会当真，别拿痛处开玩笑。']
    ] },
    { title: '哪件小事，让你觉得没白交？', hint: '不用多大，记得住就行。', options: [
      ['留一口', '好吃的没吃完，专门给你留着。'], ['发照片', '你没去成，也把沿途拍给你看。'],
      ['来帮忙', '看见你忙不过来，就过来搭把手。'], ['记得住', '随口提过的小事，下次还记得。']
    ] },
    { title: '朋友不高兴了，你希望 TA 怎么说？', hint: '关系好，也难免有不高兴。', options: [
      ['直说', '哪句话不舒服，直接告诉我。'], ['缓缓', '先各自静一静，晚点再聊。'], ['给信号', '说不出口也行，让我知道你不开心。']
    ] },
    { title: '你喜欢和朋友多久联系一次？', hint: '按你舒服的来。', options: [
      ['天天聊', '吃了什么、遇到什么，都想发过去。'], ['有事就找', '想到了就聊，不用每天打卡。'], ['隔阵子聚', '平时各忙各的，见面照样聊得来。']
    ] },
    { title: '碰到自己搞不定的事，你一般会？', hint: '不是每件事都得自己扛。', options: [
      ['直接喊人', '不硬撑，开口问朋友能不能帮。'], ['先试试', '自己弄一会儿，不行再找人。'], ['不太会求助', '怕麻烦别人，能自己扛就自己扛。']
    ] },
    { title: '意见不一样，你更喜欢怎么解决？', hint: '朋友也可以有自己的想法。', options: [
      ['说清楚', '各说各的理由，别光顾着让步。'], ['各选各的', '吃什么、玩什么，不用次次统一。'],
      ['轮着来', '这次听你的，下次听我的。'], ['先缓缓', '说急了容易伤人，冷静了再聊。']
    ] },
    { title: '哪件事，让你不想再做朋友？', hint: '最后一题。选你的底线。', options: [
      ['传话', '私下说的事，转头就告诉别人。'], ['敷衍', '约好的事总放鸽子，也不解释。'],
      ['越界', '替你做决定，还说是为你好。'], ['单方面', '每次都是自己主动，对方从不找你。']
    ] }
  ];
  const types = [
    { title: '能放松做自己的友情', short: '一起自在', quote: '我可以随意一点，也有人愿意跟我一起笑。' },
    { title: '遇事有人并肩的友情', short: '有人并肩', quote: '我不用事事独自解决，身边有人愿意一起做。' },
    { title: '说真话也安心的友情', short: '安心说真话', quote: '我可以说真话，也不用担心亲近反过来伤到自己。' },
    { title: '不在场也被惦记的友情', short: '一直被惦记', quote: '我不在的时候，也有人给我留一个位置。' }
  ];
  function validAnswers(a) {
    return Array.isArray(a) && a.length === questions.length && questions.every((q, i) => Number.isInteger(a[i]) && a[i] >= 0 && a[i] < q.options.length);
  }
  function cleanName(n) { return Array.from(String(n || '').replace(/[\u0000-\u001f\u007f]/g, '').trim()).slice(0, 12).join(''); }
  function profile(name, answers) {
    if (!validAnswers(answers)) throw new Error('请完成全部 8 道题，再生成结果。');
    const n = cleanName(name);
    if (!n) throw new Error('先写一个昵称吧。');
    return { name: n, answers: answers.slice() };
  }
  function checksum(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
    return (h >>> 0).toString(36).padStart(7, '0');
  }
  function encode(p) {
    p = profile(p.name, p.answers);
    const bytes = new TextEncoder().encode(JSON.stringify([p.name, p.answers.join('')]));
    let str = ''; bytes.forEach(b => { str += String.fromCharCode(b); });
    const payload = btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return 'F2.' + payload + '.' + checksum(payload);
  }
  function decode(input) {
    const str = String(input || '').trim();
    if (str.length > 300) throw new Error('结果码太长了，请只粘贴以 F2. 开头的那一串。');
    const match = /^F2\.([A-Za-z0-9_-]+)\.([a-z0-9]{7})$/.exec(str);
    if (!match) throw new Error('结果码格式不对，请完整复制以 F2. 开头的那一串。');
    if (checksum(match[1]) !== match[2]) throw new Error('结果码似乎少了一段或被改动了，请重新复制。');
    try {
      const padded = match[1].replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - match[1].length % 4) % 4);
      const decoded = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(atob(padded), c => c.charCodeAt(0))));
      if (!Array.isArray(decoded) || decoded.length !== 2 || typeof decoded[0] !== 'string' || typeof decoded[1] !== 'string' || !/^\d{8}$/.test(decoded[1]) || cleanName(decoded[0]) !== decoded[0]) throw new Error();
      return profile(decoded[0], Array.from(decoded[1], Number));
    } catch (_) { throw new Error('这份结果码无法读取，请让朋友重新生成一次。'); }
  }
  const labels = ['最看重的', '玩笑的分寸', '被在意的信号', '不开心时', '联系的节奏', '需要帮助时', '意见不同时', '最在意的底线'];
  function matching(pa, pb) {
    const a = profile(pa.name, pa.answers), b = profile(pb.name, pb.answers);
    const same = a.answers.filter((value, i) => value === b.answers[i]).length;
    return { score: Math.round(same / questions.length * 100), same, total: questions.length };
  }
  const sameAdvice = [
    ['一起笑，就是很重要的事', '你们都先选了“有趣”。可以给关系留一点不用做正事的时间，普通日常也值得分享。'],
    ['彼此都把靠谱放在前面', '你们都重视需要时找得到人。答应之前说清楚能做多少，比勉强答应更能保护信任。'],
    ['都愿意把真话留在关系里', '你们都先选了“真诚”。表达可以直接一点，也给对方解释和补充的机会。'],
    ['都想在对方心里有个位置', '你们都先选了“惦记”。一句主动问候、记住一件小事，都可能比热闹的聚会更有分量。']
  ];
  function report(pa, pb) {
    const a = profile(pa.name, pa.answers), b = profile(pb.name, pb.answers);
    const x = a.answers, y = b.answers;
    const rows = labels.map((title, i) => ({ title, a: questions[i].options[x[i]][0], b: questions[i].options[y[i]][0], same: x[i] === y[i] }));
    const strengths = [], differences = [], agreements = [];
    function push(list, title, text, indices) { list.push({ title, text, basis: indices.map(i => ({ question: questions[i].title, a: questions[i].options[x[i]][0], b: questions[i].options[y[i]][0] })) }); }
    if (x[0] === y[0]) push(strengths, sameAdvice[x[0]][0], sameAdvice[x[0]][1], [0]);
    if (x[2] === y[2]) {
      const text = ['留一口好吃的，你们都很吃这一套。下次遇到喜欢的东西，可以顺手为对方留一份。', '你们都喜欢被分享日常。即使没有一起出门，一张沿途照片也能让对方觉得自己被带上了。', '你们都看重实际行动。问一句“我来帮哪一块”，很可能比空泛安慰更有用。', '你们都容易被“居然还记得”打动。下次见面，接着聊那件没讲完的小事。'][x[2]];
      push(strengths, '你们接收在意的方式很接近', text, [2]);
    }
    if (x[4] === y[4]) push(strengths, '联系的节奏比较合拍', ['你们都喜欢常常分享，可以放心发日常；忙时也提前打个招呼，不把秒回变成任务。', '你们都接受想到就聊。隔一阵再打开对话，不需要先为没联系道歉。', '你们都能接受各忙各的，见面再好好聊。可以留一个下一次见面的约定。'][x[4]], [4]);
    if (x[7] === y[7]) push(strengths, '对同一条底线都很认真', ['你们都不希望私事被转述。共同约定：没有明确同意，就不把对方的私事讲给第三个人。', '你们都在意承诺有回应。临时变动尽早说，并主动补一个安排。', '你们都在意自己的决定权。提建议之前先问，不替对方做主。', '你们都希望主动是双向的。别一直等同一个人开口，也轮流约一约。'][x[7]], [7]);
    if (x[3] === y[3] && x[6] === y[6]) push(strengths, '处理不舒服的方式比较接近', '你们对不开心和分歧的处理选择相同。真正遇到事情时，可以先按这份约定开口，再根据当时的感受调整。', [3, 6]);
    function difference(title, indices, risk, advice) {
      differences.push({ title, risk, advice, text: risk + ' ' + advice, basis: indices.map(i => ({ question: questions[i].title, label: labels[i], a: rows[i].a, b: rows[i].b })) });
    }
    if (x[0] !== y[0]) difference('最看重什么', [0], '你觉得已经做得很好，对方在意的事却可能还没被照顾到。', '各说一件“这样做，我会觉得你很在意我”的小事。');
    if (x[1] !== y[1]) difference('玩笑的分寸', [1], '你觉得是在逗乐，对方可能已经不舒服。', '先按更谨慎的一方来；有人说不好笑，就停。');
    if (x[2] !== y[2]) difference('被在意的小事', [2], '你表达了关心，对方却没从自己在意的小事里感受到。', '照着对方选的那件小事，试着做一次。');
    if (x[4] !== y[4]) {
      const frequent = x[4] < y[4] ? a.name : b.name, slow = x[4] < y[4] ? b.name : a.name;
      difference('联系的频率', [4], frequent + '可能把少联系当成冷淡，' + slow + '可能觉得频繁聊天有压力。', '忙时说一句“晚点回你”，一起约定舒服的联系节奏。');
    }
    if (x[3] !== y[3] || x[6] !== y[6]) {
      let risk;
      if (x[3] !== y[3]) risk = x[3] === 1 || y[3] === 1 ? '想先缓缓时被继续追问，可能让双方更着急。' : '一方等着听直话，另一方只给信号，不开心可能被漏过去。';
      else if (x[6] === 3 || y[6] === 3) risk = '对暂停和继续处理的时机，你们可能理解不同。';
      else if (x[6] === 0 || y[6] === 0) risk = '一方想谈清理由，另一方更想先决定怎么安排。';
      else risk = '一方想各自决定，另一方想轮流迁就，容易误会成不愿配合。';
      const advice = x[3] !== y[3] || x[6] === 3 || y[6] === 3 ? '先问“现在聊，还是晚点聊？”需要暂停，就约好回聊时间。' : '先约定这次怎么选：讲理由、各选各的，还是轮流决定。';
      difference('不开心与分歧', [3,6].filter(i => x[i] !== y[i]), risk, advice);
    }
    if (x[5] !== y[5]) difference('怎么开口求助', [5], '没开口的人可能在硬撑，想帮的人却以为对方不需要。', '先问“要我听你说、陪你试，还是搭把手？”');
    if (x[7] !== y[7]) difference('各自的底线', [7], '你最介意的事，对方可能还没意识到。', '记住两个人各自选的底线，遇到时先问一句。');
    if (strengths.length === 0) push(strengths, '可以从把期待说清楚开始', '这次你们没有在重点偏好上选到相同答案。这份结果能做的，是把差异说具体，让你们更容易问出“怎样对你会更好”。能否相处舒服，还要看日常行动。', [0, 2, 4]);
    const care = [a, b].map(p => {
      const z = p.answers;
      return { name: p.name, type: types[z[0]], tips: [
        ['遇到好吃的，记得留一口。', '出门遇到有意思的，拍一张发过去。', '忙不过来时，问问哪一块能帮忙。', '记住随口提过的小事，下次再问一句。'][z[2]],
        ['有日常就分享，也允许忙时晚些回复。', '想到就聊，不用把联系变成每天的任务。', '平时给彼此空间，约好见面再慢慢聊。'][z[4]],
        ['可以直接问需要帮什么，也说明自己能帮到哪。', '先让 TA 试一试，再问要不要一起处理。', '把帮助说具体，让 TA 也能放心拒绝。'][z[5]],
        ['私事先保密，转述之前征得同意。', '答应的事记在心上，变动时尽早解释。', '先征求意见，不替 TA 做决定。', '主动联系和邀约，别总让 TA 一个人来。'][z[7]]
      ] };
    });
    agreements.push({ title: '忙的时候，给个信号', text: x[4] === y[4] ? '可以说：“今天有点忙，晚点接着聊。”喜欢分享，也给对方晚回的空间。' : '可以说：“我看到啦，忙完认真回你。”先说明状态，不用靠回复速度猜关系。' });
    agreements.push({ title: '不舒服时，说清下一步', text: x[3] === 0 && y[3] === 0 && x[6] !== 3 && y[6] !== 3 ? '可以说：“刚才那句话让我有点不舒服，我想把原因讲清楚，你现在方便听吗？”' : '可以说：“我有点不舒服，想先缓一会儿。我们约个时间再聊，好不好？”暂停之后也记得回来。' });
    agreements.push({ title: '帮忙之前，先问需要', text: x[5] === 0 && y[5] === 0 ? '可以说：“我能帮这一块，其他的我们一起想办法。”能互相依靠，也允许各自有做不到的地方。' : '可以说：“你想先自己试试，还是我来搭把手？”提供选择，也认真听取对方的回答。' });
    return { a, b, types: [types[x[0]], types[y[0]]], rows, sameCount: rows.filter(r => r.same).length, matchScore: matching(a,b).score, strengths, differences, care, agreements };
  }
  return { questions, types, validAnswers, cleanName, profile, encode, decode, matching, report };
});

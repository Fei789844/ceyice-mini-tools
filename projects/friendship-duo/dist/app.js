(function () {
  'use strict';
  const F = window.Friendship, app = document.getElementById('app');
  const KEY = 'friendship-duo-v1';
  const empty = () => ({ version: 1, stage: 'home', mode: 'together', names: ['', ''], profiles: [null, null], drafts: [Array(8).fill(null), Array(8).fill(null)], player: 0, q: 0, editing: false });
  let state = empty(), reportData = null, toastTimer, exportUrl, exportDataUrl = '';
  const P = window.FriendshipPlatform;
  let stored = null;
  // Read persisted state after platform selection; native storage is preferred in the host.
  function validState(s) {
    return !!s && s.version === 1 && ['home','setup','quiz','handoff','exchange','report'].includes(s.stage) && ['together','remote'].includes(s.mode) && Array.isArray(s.names) && s.names.length === 2 && s.names.every(n => typeof n === 'string' && F.cleanName(n) === n) && Array.isArray(s.drafts) && s.drafts.length === 2 && s.drafts.every(d => Array.isArray(d) && d.length === 8 && d.every((v,i) => v === null || (Number.isInteger(v) && v >= 0 && v < F.questions[i].options.length))) && Array.isArray(s.profiles) && s.profiles.length === 2 && s.profiles.every(p => p === null || (typeof p.name === 'string' && F.cleanName(p.name) === p.name && p.name.length > 0 && F.validAnswers(p.answers))) && [0,1].includes(s.player) && Number.isInteger(s.q) && s.q >= 0 && s.q < 8 && (s.stage !== 'report' || s.profiles.every(Boolean)) && (!['exchange','handoff'].includes(s.stage) || !!s.profiles[0]) && (s.stage !== 'quiz' || !!s.names[s.player]) && (s.stage !== 'quiz' || s.player !== 1 || !!s.profiles[0]);
  }
  function normalize(s) { const clean = Object.assign({}, s); delete clean.photos; return clean; }
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const nl = s => esc(s).replace(/\n/g, '<br>');
  function save() { P.set(KEY, state.stage === 'home' && stored ? stored : state).then(ok => { if (!ok && state.stage !== 'home') showToast('本机暂时无法保存进度，请先保存结果码或图片。'); }); }
  function showToast(message) {
    const el = document.getElementById('toast'); el.textContent = message; el.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
  }
  function render(focus = true) {
    state = normalize(state);
    const stages = { home, setup, quiz, handoff, exchange, report };
    app.innerHTML = stages[state.stage](); bind(); save();
    if (focus) { app.focus({ preventScroll: true }); window.scrollTo(0,0); }
  }
  function icon(size = '') { return '<div class="icon-wrap ' + size + '"><img class="appicon" src="assets/icon.jpg" alt="蓝色与绿色的两个小伙伴"><span class="app-dot" aria-hidden="true"></span></div>'; }
  function home() {
    return '<section class="hero"><p class="eyebrow">测测你的理想好友 · 双人篇</p><div class="introcopy"><h1>闺蜜，你最好<br>测出来<em>是我。</em></h1><p class="lead">两个人，各答八道小问题。<br>把彼此的在意，写成一份相处说明书。</p></div>' + icon() + '<p class="heronote">合拍的地方，和需要慢慢懂的地方。</p><div class="actions stack"><button class="button primary" data-action="together">就在一起，轮流测　↗</button><button class="button secondary" data-action="remote">不在一起，交换结果码</button></div>' + (stored && stored.stage !== 'home' ? '<div class="resume"><span>上次还留了一份进度。</span><button data-action="resume">接着来 →</button></div>' : '') + '<p class="fineprint">没有好友也可以先测，答完留一份自己的结果码。<br>两份答案都齐了，再生成你们的说明书。</p></section>';
  }
  function setup() {
    const together = state.mode === 'together';
    return '<section class="sectionpage"><button class="back" data-action="home">← 回到开头</button><p class="eyebrow">' + (together ? '同一台手机，轮流认真答' : '各自作答，再把答案放在一起') + '</p><h1>先留两个位置。</h1><p class="lead">' + (together ? '一个人先答，另一个人先别偷看。<br>等两个人都答完，再一起拆开结果。' : '先答自己的，再把结果码发给朋友。<br>朋友也选这个入口，答完后互相粘贴结果码。') + '</p><form id="setup-form"><label class="formlabel" for="name-a">' + (together ? '先答的人，怎么称呼？' : '怎么称呼你？') + '</label><input id="name-a" name="name-a" maxlength="24" autocomplete="off" placeholder="比如：小林" value="' + esc(state.names[0]) + '" required>' + (together ? '<label class="formlabel" for="name-b">另一位呢？</label><input id="name-b" name="name-b" maxlength="24" autocomplete="off" placeholder="比如：阿圆" value="' + esc(state.names[1]) + '" required>' : '') + '<p class="muted" style="margin-top:8px">用昵称就好，最多 12 个字。</p><p class="error" id="setup-error" role="alert"></p><button class="button primary actions" type="submit">开始答题　↗</button></form><p class="privacy">' + (together ? '第二个人答题时不会显示第一个人的选择。' : '结果码包含昵称和选项，没有加密，只发给愿意分享的朋友。') + '进度仅保存在当前设备，不会自动同步。</p></section>';
  }
  function quiz() {
    const q = F.questions[state.q], chosen = state.drafts[state.player][state.q];
    const isLast = state.q === 7;
    return '<section class="sectionpage"><div class="quiz-top"><button class="back" data-action="prev">← ' + (state.q ? '上一题' : '返回') + '</button><span>' + String(state.q + 1).padStart(2, '0') + ' / 08</span></div><div class="progress" role="progressbar" aria-label="答题进度" aria-valuenow="' + (state.q+1) + '" aria-valuemin="1" aria-valuemax="8"><span style="width:' + (state.q+1)*12.5 + '%"></span></div><span class="player-pill">现在是 ' + esc(state.names[state.player]) + ' 的时间</span><h1 class="question" id="question-title">' + esc(q.title) + '</h1><p class="muted">' + esc(q.hint) + '</p><div class="choicegroup" role="radiogroup" aria-labelledby="question-title">' + q.options.map((o, i) => '<button class="choice" role="radio" aria-checked="' + (chosen === i) + '" data-choice="' + i + '"><span class="letter" aria-hidden="true">' + 'ABCD'[i] + '</span><span><strong>' + esc(o[0]) + '</strong><small>' + esc(o[1]) + '</small></span></button>').join('') + '</div><div class="quiz-footer"><button class="button primary" id="next" data-action="next" ' + (chosen === null ? 'disabled' : '') + '>' + (isLast ? (state.editing || state.player === 1 ? '生成我们的说明书　↗' : '我答好了　→') : '下一题　→') + '</button></div><p class="fineprint">选最像自己的，不用猜对方喜欢哪个。</p></section>';
  }
  function handoff() {
    return '<section class="handoff"><p class="eyebrow">第一份答案，收好了。</p>' + icon() + '<h1>现在，把手机交给<br>' + esc(state.names[1]) + '。</h1><p class="lead">前面的选择先保密。<br>照着自己的感受选，等会儿一起看。</p><button class="button primary actions" data-action="second">我是 ' + esc(state.names[1]) + '，轮到我啦　↗</button><button class="linkbutton" data-action="edit-a">第一位想改个答案</button></section>';
  }
  function exchange() {
    const p = state.profiles[0], type = F.types[p.answers[0]], code = F.encode(p);
    return '<section class="sectionpage"><p class="eyebrow">你这一份，先收好。</p><h1>' + esc(p.name) + '想要的，<br>是这样的友情。</h1><div class="typecard"><h3>' + esc(type.title) + '</h3><p>“' + esc(type.quote) + '”</p></div><div class="codebox"><label for="own-code">复制这一串给朋友</label><textarea id="own-code" readonly spellcheck="false" aria-label="我的结果码">' + code + '</textarea><button class="button secondary" data-action="copy-code">复制我的结果码</button></div><p class="fineprint">朋友也选「不在一起，交换结果码」，完成 8 道题。<br>把朋友的结果码粘到下面，就能合成你们的说明书。</p><form id="merge-form"><label class="formlabel" for="friend-code">朋友的结果码</label><textarea id="friend-code" placeholder="粘贴 F2. 开头的完整结果码" spellcheck="false" autocomplete="off" required></textarea><p class="error" id="code-error" role="alert"></p><button class="button primary actions" type="submit">生成我们的说明书　↗</button></form><div class="switch-links"><button class="linkbutton" data-action="local-partner">朋友就在旁边，直接让 TA 答</button><button class="linkbutton" data-action="edit-a">改改我的答案</button></div><p class="privacy">结果码可被读取，并非匿名凭证。昵称和选项只在这台设备合并，不会上传；也不会自动传到对方手机。</p></section>';
  }
  function evidence(item, r) {
    return '<details class="basis"><summary>看看你们的选择</summary>' + item.basis.map(row => '<span>' + esc(row.question) + '<br>' + esc(r.a.name) + '：' + esc(row.a) + '　 /　' + esc(r.b.name) + '：' + esc(row.b) + '</span>').join('') + '</details>';
  }
  function insight(item, r) { return '<article class="insight"><h3>' + esc(item.title) + '</h3><p>' + esc(item.text) + '</p>' + evidence(item, r) + '</article>'; }
  function differenceCard(item, r, i) {
    return '<article class="difference-card"><h3><span class="difference-index">' + (i+1) + '</span>' + esc(item.title) + '</h3><div class="difference-choices">' + item.basis.map(row => '<div class="difference-topic">' + esc(row.label) + '</div><div class="difference-pair"><div><small>' + esc(r.a.name) + '</small><span>' + esc(row.a) + '</span></div><div><small>' + esc(r.b.name) + '</small><span>' + esc(row.b) + '</span></div></div>').join('') + '</div><dl class="difference-guidance"><div><dt>容易误会</dt><dd>' + esc(item.risk) + '</dd></div><div class="difference-advice"><dt>相处建议</dt><dd>' + esc(item.advice) + '</dd></div></dl></article>';
  }
  function differenceSection(r) {
    return '<section class="section"><p class="section-number">02</p><h2>容易误会的地方</h2>' + (r.differences.length ? r.differences.map((item,i) => differenceCard(item,r,i)).join('') : '<p class="no-differences">这次 8 个选择都相同，没有明显的选项差异。</p>') + '</section>';
  }
  function scorePanel(r) {
    return '<div class="match-panel"><p>相处匹配度</p><div class="match-number">' + r.matchScore + '<span>%</span></div><p class="match-caption">这次答题，有 ' + r.sameCount + ' / 8 个相同选择</p><details class="score-rule"><summary>分数怎么算？</summary><p>8 道题等权，相同的选项计 1，不同计 0。相同题数 ÷ 8 × 100，四舍五入到整数。这个分数表示答题相似度，不预测关系好坏。</p></details></div>';
  }
  function report() {
    const r = F.report(state.profiles[0], state.profiles[1]); reportData = r;
    return '<article><div class="report-title"><p class="eyebrow">朋友观察手册 · 我们这一篇</p><div class="namesline"><span>' + esc(r.a.name) + '</span><i>＆</i><span>' + esc(r.b.name) + '</span></div><h1>闺蜜相处说明书</h1><p class="lead">把“我以为”，慢慢变成“我知道”。</p>' + scorePanel(r) + '<div class="pairtypes">' + [r.a,r.b].map((p,i) => '<div class="typecard"><div class="person-name">' + esc(p.name) + ' 更期待</div><h3>' + esc(r.types[i].short) + '</h3><p>' + esc(r.types[i].quote) + '</p></div>').join('') + '</div></div><section class="section"><p class="section-number">01 / 合拍的地方</p><h2>这些事，你们比较容易懂。</h2>' + r.strengths.map(item => insight(item,r)).join('') + '</section>' + differenceSection(r) + '<section class="section"><p class="section-number">03 / 照顾彼此的小抄</p><h2>如果想对 TA 好一点。</h2><div class="care-grid">' + r.care.map(p => '<article class="carecard"><h3>给 ' + esc(p.name) + ' 的那一份</h3><p class="muted">TA 更容易收到这样的关心</p><ul class="tiplist">' + p.tips.map(t => '<li>' + esc(t) + '</li>').join('') + '</ul></article>').join('') + '</div></section><section class="section"><p class="section-number">04 / 我们的小约定</p><h2>下一次，可以从这三句开始。</h2>' + r.agreements.map((p,i) => '<article class="agreement"><h3>' + (i+1) + '. ' + esc(p.title) + '</h3><p>' + esc(p.text) + '</p></article>').join('') + '<p class="agreement-note">这是给你们商量的草稿，觉得合适再约定。</p></section><section class="section"><details><summary>展开看看：我们各自怎么选</summary><div class="compare" role="table" aria-label="两人的答案对照"><div class="compare-row" role="row"><span role="columnheader">这件事</span><span role="columnheader">' + esc(r.a.name) + '</span><span role="columnheader">' + esc(r.b.name) + '</span></div>' + r.rows.map(row => '<div class="compare-row" role="row" data-same="' + row.same + '"><span role="cell">' + esc(row.title) + '</span><span role="cell">' + esc(row.a) + '</span><span role="cell">' + esc(row.b) + '</span></div>').join('') + '</div></details><p class="fineprint">按这次作答整理，留给你们一起对照讨论。</p></section><div class="report-actions"><button class="button primary" data-action="export">保存我们的说明书　↓</button><button class="button secondary" data-action="exchange">发结果码，让朋友也能生成</button></div><div class="switch-links"><button class="linkbutton" data-action="edit-a">修改 ' + esc(r.a.name) + ' 的答案</button><button class="linkbutton" data-action="edit-b">修改 ' + esc(r.b.name) + ' 的答案</button><button class="linkbutton" data-action="restart">重新开始</button></div><button class="linkbutton" data-action="clear-data">清除本机记录</button></article>';
  }
  function edit(player) {
    state.editing = !!(state.profiles[0] && state.profiles[1]); state.player = player; state.q = 0;
    state.drafts[player] = state.profiles[player] ? state.profiles[player].answers.slice() : state.drafts[player];
    state.stage = 'quiz'; render();
  }
  function start(mode) { state = empty(); state.mode = mode; state.stage = 'setup'; stored = null; render(); }
  function next() {
    if (state.drafts[state.player][state.q] === null) return;
    if (state.q < 7) { state.q++; render(); return; }
    state.profiles[state.player] = F.profile(state.names[state.player], state.drafts[state.player]);
    if (state.editing || state.player === 1) { state.stage = 'report'; state.editing = false; }
    else state.stage = state.mode === 'together' ? 'handoff' : 'exchange';
    render();
  }
  function goHome() { stored = state.stage === 'home' ? stored : JSON.parse(JSON.stringify(state)); state = empty(); render(); }
  function onAction(action) {
    switch (action) {
      case 'home': goHome(); break;
      case 'together': start('together'); break;
      case 'remote': start('remote'); break;
      case 'resume': if (validState(stored)) { state = normalize(stored); stored = null; render(); } break;
      case 'prev':
        if (state.q > 0) { state.q--; render(); }
        else { state.stage = state.editing ? 'report' : (state.player === 1 ? 'handoff' : 'setup'); state.editing = false; render(); } break;
      case 'next': next(); break;
      case 'second': state.player = 1; state.q = 0; state.stage = 'quiz'; state.editing = false; render(); break;
      case 'edit-a': edit(0); break;
      case 'edit-b': edit(1); break;
      case 'exchange': state.stage = 'exchange'; render(); break;
      case 'copy-code': copyCode(); break;
      case 'local-partner':
        state.mode = 'together'; state.profiles[1] = null; state.drafts[1] = Array(8).fill(null); state.names[1] = ''; state.stage = 'setup'; render();
        document.getElementById('name-a').value = state.names[0];
        document.getElementById('name-b').focus(); break;
      case 'restart':
        if (window.confirm('重新开始会清除这次的两份答案。要继续吗？')) { state = empty(); stored = null; render(); } break;
      case 'clear-data':
        if (window.confirm('清除当前设备的昵称、答案和进度？已经发给朋友的结果码不会一起删除。')) {
          state = empty(); stored = null; reportData = null; render();
          P.remove(KEY);
          showToast('本机记录已清除');
        } break;
      case 'export': exportCard(); break;
    }
  }
  function bind() {

    app.querySelectorAll('[data-action]').forEach(el => el.addEventListener('click', () => onAction(el.dataset.action)));
    app.querySelectorAll('[data-choice]').forEach(el => el.addEventListener('click', () => {
      const index = Number(el.dataset.choice); state.drafts[state.player][state.q] = index;
      app.querySelectorAll('[data-choice]').forEach(btn => btn.setAttribute('aria-checked', String(btn === el)));
      document.getElementById('next').disabled = false; save();
    }));
    const choices = app.querySelector('.choicegroup');
    if (choices) choices.addEventListener('keydown', e => {
      if (!['ArrowDown','ArrowRight','ArrowUp','ArrowLeft','Home','End'].includes(e.key)) return;
      e.preventDefault(); const buttons = Array.from(choices.querySelectorAll('[data-choice]'));
      let i = buttons.indexOf(document.activeElement);
      i = e.key === 'Home' ? 0 : e.key === 'End' ? buttons.length-1 : (i + (['ArrowDown','ArrowRight'].includes(e.key) ? 1 : -1) + buttons.length) % buttons.length;
      buttons[i].focus(); buttons[i].click();
    });
    const setupForm = document.getElementById('setup-form');
    if (setupForm) setupForm.addEventListener('submit', e => {
      e.preventDefault(); const n0 = F.cleanName(document.getElementById('name-a').value);
      const n1 = state.mode === 'together' ? F.cleanName(document.getElementById('name-b').value) : '';
      if (!n0 || (state.mode === 'together' && !n1)) { document.getElementById('setup-error').textContent = '昵称不能只留空格，换个称呼吧。'; return; }
      const firstDone = !!state.profiles[0];
      if (firstDone && n0 !== state.names[0]) state.profiles[0].name = n0;
      state.names = [n0, n1]; state.player = firstDone ? 1 : 0; state.q = 0; state.stage = 'quiz'; render();
    });
    const mergeForm = document.getElementById('merge-form');
    if (mergeForm) mergeForm.addEventListener('submit', e => {
      e.preventDefault();
      try {
        const p = F.decode(document.getElementById('friend-code').value);
        if (F.encode(p) === F.encode(state.profiles[0]) && !window.confirm('这份码和你自己的完全相同。确认这是朋友独立作答的结果吗？')) return;
        state.profiles[1] = p; state.names[1] = p.name; state.drafts[1] = p.answers.slice(); state.stage = 'report'; state.editing = false; render();
      } catch (err) { document.getElementById('code-error').textContent = err.message; }
    });
  }
  async function copyCode() {
    const el = document.getElementById('own-code');
    try {
      if (!navigator.clipboard || !window.isSecureContext) throw new Error();
      await navigator.clipboard.writeText(el.value); showToast('复制好了，发给朋友吧');
    } catch (_) {
      el.focus(); el.select(); el.setSelectionRange(0, el.value.length); showToast('已选中，请长按复制或按 Ctrl/Cmd+C');
    }
  }
  // Canvas output uses measured wrapping, so long nicknames and Chinese copy stay inside the page.
  async function exportCard() {
    if (!reportData) return;
    const btn = app.querySelector('[data-action="export"]'); btn.disabled = true; btn.textContent = '正在整理成一张长图…';
    try {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      const r = reportData, canvas = document.createElement('canvas'), ctx = canvas.getContext('2d');
      const width = 1080, pad = 82, textWidth = width - pad*2, blocks = [];
      let y = 92;
      const font = (size, weight) => (weight || 400) + ' ' + size + 'px -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif';
      function lines(text, size, weight, maxWidth) {
        ctx.font = font(size, weight); const result = [];
        String(text).split('\n').forEach(part => {
          let line = '';
          Array.from(part).forEach(char => { if (line && ctx.measureText(line+char).width > maxWidth) { result.push(line); line = char; } else line += char; });
          result.push(line);
        });
        return result;
      }
      function add(text, size = 29, color = '#66746b', weight = 400, gap = 22) {
        const wrapped = lines(text,size,weight,textWidth); const lineHeight = Math.round(size*1.75);
        blocks.push({ kind: 'text', text: wrapped, size, color, weight, y, lineHeight }); y += wrapped.length * lineHeight + gap;
      }
      function section(kicker,title) { y += 40; blocks.push({ kind: 'line', y }); y += 44; add(kicker,23,'#9f705d',500,14); add(title,38,'#293d47',600,25); }
      add('朋友观察手册 · 双人篇',24,'#7c8a6d',500,26);
      add(r.a.name+' ＆ '+r.b.name,30,'#697b59',500,12);
      add('闺蜜相处说明书',57,'#293d47',600,22);
      add('把“我以为”，慢慢变成“我知道”。',29,'#788472',400,28);
      [r.a,r.b].forEach((p,i) => { add(p.name+' 更期待：'+r.types[i].title,29,'#344c4c',600,6); add('“'+r.types[i].quote+'”',27,'#7c8577',400,22); });
      add('答题匹配度 '+r.matchScore+'% · 相同选择比例',32,'#49643f',600,18);
      add('8 个选择里，'+r.sameCount+' 处相同，'+(8-r.sameCount)+' 处不同。\n相同与不同，都可以成为理解彼此的线索。',25,'#889180',400,10);
      section('01 / 合拍的地方','这些事，你们比较容易懂。');
      r.strengths.forEach(item => { add(item.title,32,'#34494a',600,8); add(item.text); });
      section('02','容易误会的地方');
      if (!r.differences.length) add('这次 8 个选择都相同，没有明显的选项差异。');
      r.differences.forEach((item,i) => {
        add((i+1)+'. '+item.title,32,'#34494a',600,8);
        item.basis.forEach(row => add(row.label+'：'+r.a.name+' · '+row.a+' / '+r.b.name+' · '+row.b,24,'#87927b',400,8));
        add('容易误会：'+item.risk,28,'#69776b',400,10);
        add('相处建议：'+item.advice,28,'#49643f',500,24);
      });
      section('03 / 照顾彼此的小抄','如果想对 TA 好一点。');
      r.care.forEach(p => { add('给 '+p.name+' 的那一份',33,'#34494a',600,8); p.tips.forEach(t => add('· '+t,28,'#69776b',400,10)); y += 15; });
      section('04 / 我们的小约定','下一次，可以从这三句开始。');
      r.agreements.forEach((p,i) => { add((i+1)+'. '+p.title,32,'#34494a',600,8); add(p.text); });
      y += 20; add('这是给你们商量的草稿，觉得合适再约定。',24,'#8b927f',400,20);
      add('按这次作答整理，留给你们一起对照讨论。',23,'#8b927f',400,0);
      canvas.width = width; canvas.height = Math.ceil(y+80);
      if (canvas.height > 20000) throw new Error('这份长图太长，请使用页面截图保存。');
      ctx.fillStyle = '#f7f5ef'; ctx.fillRect(0,0,width,canvas.height); ctx.textBaseline = 'top';
      blocks.forEach(b => {
        if (b.kind === 'line') { ctx.strokeStyle = '#d9dfd1'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(pad,b.y); ctx.lineTo(width-pad,b.y); ctx.stroke(); }
        else { ctx.font = font(b.size,b.weight); ctx.fillStyle = b.color; b.text.forEach((line,i) => ctx.fillText(line,pad,b.y+i*b.lineHeight)); }
      });
      openExport(canvas.toDataURL('image/png'));
    } catch (err) { showToast(err.message || '没能保存，请先用页面截图留一份。'); }
    finally { btn.disabled = false; btn.textContent = '保存我们的说明书　↓'; }
  }
  function openExport(dataUrl) {
    exportDataUrl=dataUrl;
    const dialog=document.getElementById('export-dialog'), img=document.getElementById('export-image'), link=document.getElementById('download-image');
    document.getElementById('export-title').textContent='留一份，慢慢相处。';
    img.src=dataUrl; img.alt='两个人的闺蜜相处说明书长图';
    // Blob download works in browsers that block a direct data-URI download.
    const raw=atob(dataUrl.slice(dataUrl.indexOf(',')+1)), bytes=new Uint8Array(raw.length);
    for(let i=0;i<raw.length;i++) bytes[i]=raw.charCodeAt(i);
    if(exportUrl)URL.revokeObjectURL(exportUrl);
    exportUrl=URL.createObjectURL(new Blob([bytes],{type:'image/png'}));
    link.href=exportUrl; link.download='我们的闺蜜相处说明书.png';
    link.textContent='下载说明书';
    const native=P.hasNativeSave(); link.hidden=native; document.getElementById('native-save').hidden=!native;
    document.getElementById('export-help').textContent=native?'点击保存到相册，也可以长按图片。':'手机长按图片保存；电脑可点击下方下载。';
    if(typeof dialog.showModal==='function') dialog.showModal(); else {dialog.setAttribute('open','');dialog.classList.add('dialog-fallback');}
  }
  document.getElementById('native-save').addEventListener('click',async () => {
    const btn=document.getElementById('native-save');btn.disabled=true;
    try{if(await P.saveImage(exportDataUrl)) showToast('已保存到相册');else showToast('请长按图片保存');}
    catch(_){showToast('没有保存成功，请允许相册权限或长按图片保存。');}
    finally{btn.disabled=false;}
  });
  document.getElementById('close-export').addEventListener('click', () => { const d=document.getElementById('export-dialog');if(typeof d.close==='function')d.close();else d.removeAttribute('open');d.classList.remove('dialog-fallback'); });
  document.getElementById('brand').addEventListener('click', e => { e.preventDefault(); goHome(); });
  P.get(KEY).then(value => { if (validState(value)) stored=normalize(value); render(false); });
})();

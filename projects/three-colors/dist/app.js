'use strict';
const families = [
  { name: '橘子摊', paper: '#FFF0DB', ink: '#503021', accents: ['#BF7558', '#C74B24'] },
  { name: '林间小路', paper: '#E8F0DD', ink: '#233F35', accents: ['#7A967B', '#16785C'] },
  { name: '傍晚的海', paper: '#E6EFF8', ink: '#283950', accents: ['#819AB2', '#4263B6'] }
];
const moods = ['柔和一点', '鲜明一点'];
const uses = [
  ['手账', '纸面', '手写字', '日期圆点', '周五小记'],
  ['聚会请柬', '卡片底色', '邀请文字', '边角装饰', '周末来坐坐'],
  ['手机壁纸', '背景', '短句', '小图形', '慢慢来']
];
const questions = [
  ['哪处颜色让你想多看一眼？', families.map(x => x.name)],
  ['点缀的颜色想要多醒目？', moods],
  ['准备用在哪里？', uses.map(x => x[0])]
];
const view = document.querySelector('#view');
let answers = [];
function add(parent, tag, text, cls) {
  const node = document.createElement(tag);
  node.textContent = text;
  if (cls) node.className = cls;
  parent.appendChild(node);
  return node;
}
function button(text, action, cls) {
  add(view, 'button', text, cls).addEventListener('click', action);
}
function home() {
  answers = [];
  view.textContent = '';
  add(view, 'h1', '给今天配三个颜色');
  add(view, 'p', '挑个喜欢的场景，做一张手账、请柬或壁纸用的三色卡。');
  button('挑颜色', render, 'primary');
}
function back() {
  answers.pop();
  render();
}
function result() {
  const [scene, mood, use] = answers;
  const palette = families[scene];
  const sample = uses[use];
  const accent = palette.accents[mood];
  add(view, 'small', palette.name + ' · ' + moods[mood]);
  add(view, 'h1', '你的' + sample[0] + '色卡');
  const preview = add(view, 'div', '', 'preview');
  preview.style.backgroundColor = palette.paper;
  preview.style.color = palette.ink;
  const mark = add(preview, 'i', '');
  mark.style.backgroundColor = accent;
  add(preview, 'strong', sample[4]);
  [palette.paper, palette.ink, accent].forEach((color, i) => {
    const row = add(view, 'div', '', 'swatch');
    add(row, 'i', '').style.backgroundColor = color;
    add(row, 'span', sample[i + 1]);
    add(row, 'code', color);
  });
  button('换个用途', back, 'back');
  button('重新配色', home, 'primary');
}
function render() {
  view.textContent = '';
  window.scrollTo(0, 0);
  const n = answers.length;
  if (n === questions.length) { result(); return; }
  const [title, options] = questions[n];
  add(view, 'small', '第 ' + (n + 1) + ' / 3 题');
  add(view, 'h2', title);
  options.forEach((label, index) => button(label, () => {
    answers.push(index);
    render();
  }));
  if (n) button('返回上一题', back, 'back');
}
home();

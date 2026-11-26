'use strict';
const steps = [
  ['这次出去多久？', [
    ['当天来回', []], ['住一晚', ['一套换洗衣物', '牙刷和小支牙膏']], ['住两晚', ['两套换洗衣物', '牙刷和小支牙膏', '装换下衣物的小袋子']]
  ]],
  ['大部分时间准备怎么过？', [
    ['城里逛逛', ['一双走路舒服的鞋', '装零碎东西的小布袋']], ['到郊外走走', ['水壶', '一份路上吃的小点心']], ['去朋友家', ['和朋友核对门牌或见面位置']]
  ]],
  ['看过预报，这趟需要应付什么？', [
    ['可能下雨', ['折叠伞或雨衣']], ['风大偏冷', ['一件挡风外套']], ['晴天有太阳', ['遮阳帽']]
  ]]
];
const view = document.querySelector('#view');
let answers = [];
const packed = new Set();
function add(tag, text) {
  const node = document.createElement(tag);
  node.textContent = text;
  view.appendChild(node);
  return node;
}
function button(label, run, cls) {
  const btn = add('button', label);
  btn.className = cls || '';
  btn.addEventListener('click', run);
}
function home() {
  answers = [];
  packed.clear();
  view.textContent = '';
  add('h1', '周末出门，包里带什么？');
  add('p', '选行程、去处和天气，拿一张能边收边勾的单子。');
  button('列我的打包单', render, 'primary');
}
function back() {
  answers.pop();
  render();
}
function render() {
  view.textContent = '';
  window.scrollTo(0, 0);
  const n = answers.length;
  if (n === steps.length) {
    const picks = answers.map((a, i) => steps[i][1][a]);
    add('small', picks.map(p => p[0]).join(' · '));
    add('h1', '出门前过一遍');
    const items = ['手机', '钥匙', '按行程准备证件或乘车凭证'];
    picks.forEach(p => items.push(...p[1]));
    if (answers[0] > 0) items.push('手机充电线和插头');
    const status = add('p', '');
    function count() {
      status.textContent = '已备好 ' + items.filter(x => packed.has(x)).length + ' / ' + items.length + ' 项';
    }
    count();
    items.forEach(item => {
      const label = add('label', '');
      const check = document.createElement('input');
      check.type = 'checkbox';
      check.checked = packed.has(item);
      check.addEventListener('change', () => {
        if (check.checked) packed.add(item);
        else packed.delete(item);
        count();
      });
      label.appendChild(check);
      label.appendChild(document.createTextNode(item));
    });
    button('改一下行程', back, 'back');
    button('重新列一张', home, 'primary');
    return;
  }
  add('small', '第 ' + (n + 1) + ' / 3 题');
  add('h2', steps[n][0]);
  steps[n][1].forEach((item, i) => button(item[0], () => {
    answers.push(i);
    render();
  }));
  if (n > 0) button('返回上一题', back, 'back');
}
home();

'use strict';
const view = document.getElementById('view');
const bases = [
  ['番茄', '番茄半个到一个', '番茄切小块，用少许油炒软，加一大碗水煮开。'],
  ['鲜香菇', '鲜香菇两三朵', '鲜香菇洗净切薄片，用少许油炒香，加一大碗水，煮到菇片熟透。'],
  ['大白菜', '大白菜两片', '白菜洗净，菜帮切细、叶子撕小。锅里倒一大碗水，先煮软菜帮，再放叶子煮透。']
];
const extras = [
  ['嫩豆腐', '嫩豆腐小半盒', '豆腐切小块，轻轻滑进锅里，煮到中心热透。'],
  ['蛋花', '鸡蛋一个', '鸡蛋打散，在沸汤中慢慢淋一圈，等蛋花完全凝固。']
];
const staples = [
  ['喝汤', '汤', '尝一口，按口味调盐，盛进深碗。'],
  ['加米饭', '汤饭', '加小半碗熟米饭，轻轻拨散，煮到米粒热透后调味。'],
  ['配面条', '汤面', '另起锅按包装说明煮熟一小把面，沥水装碗，再浇上调好味的热汤。']
];
const steps = [
  ['你手边有哪样菜？', bases],
  ['再放点什么？', extras],
  ['这一碗怎么吃？', staples]
];
let choices = [];
function line(tag, value) {
  const node = document.createElement(tag);
  node.textContent = value;
  view.appendChild(node);
  return node;
}
function action(label, run, cls) {
  const btn = line('button', label);
  btn.className = cls || '';
  btn.addEventListener('click', run);
}
function reset() {
  choices = [];
  view.textContent = '';
  line('h1', '今晚煮什么汤？');
  line('p', '看看手边的菜，选三下，凑一碗热乎的。');
  action('挑一碗汤', render, 'primary');
}
function back() {
  choices.pop();
  render();
}
function render() {
  view.textContent = '';
  window.scrollTo(0, 0);
  const n = choices.length;
  if (n === steps.length) {
    const base = bases[choices[0]], extra = extras[choices[1]], staple = staples[choices[2]];
    line('h1', base[0] + extra[0] + staple[1]);
    const grain = ['', '、小半碗熟米饭', '、一小把面条'][choices[2]];
    line('p', '备料：' + base[1] + '、' + extra[1] + grain + '。');
    [base[2], extra[2], staple[2]].forEach((step, i) => line('p', (i + 1) + '. ' + step));
    action('换个吃法', back, 'back');
    action('重新挑一碗', reset, 'primary');
    return;
  }
  line('small', '第 ' + (n + 1) + ' / 3 题');
  line('h2', steps[n][0]);
  steps[n][1].forEach((item, i) => action(item[0], () => {
    choices.push(i);
    render();
  }));
  if (n > 0) action('返回上一题', back, 'back');
}
reset();

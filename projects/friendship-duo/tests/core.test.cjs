const test = require('node:test');
const assert = require('node:assert/strict');
const F = require('../dist/core.js');
const a = { name: '小林', answers: [0,0,0,0,0,0,0,0] };
const b = { name: '阿圆', answers: [3,2,3,1,2,2,3,3] };

test('异地结果码保留中文、emoji 和每道题的答案', () => {
  for (const name of ['小林', '🐢和🍉', '<script>', 'A&B']) {
    const p = { name, answers: b.answers };
    assert.deepEqual(F.decode(F.encode(p)), p);
  }
});
test('拒绝截断、篡改、版本错误与越界答案', () => {
  const code = F.encode(a);
  for (const bad of ['', code.slice(0,-1), code.replace('F2.', 'F3.'), code + 'x', code.replace(/.$/, code.endsWith('1') ? '2' : '1'), 'F2.'+'a'.repeat(400)]) {
    assert.throws(() => F.decode(bad));
  }
  for (const answers of [[0], Array(8).fill(-1), Array(8).fill(4), [0,3,0,0,0,0,0,0], [0,0,0,0,0,0,0,1.1]]) {
    assert.throws(() => F.encode({ name:'测试', answers }));
  }
  assert.throws(() => F.profile('  ', a.answers));
});
test('相同答案不制造差异，不使用命定式结论', () => {
  const r = F.report(a,{ name: '阿圆', answers: a.answers });
  assert.equal(r.sameCount,8);
  assert.equal(r.matchScore,100);
  assert.equal(r.differences.length,0);
  assert.ok(r.strengths.length >= 3);
  assert.doesNotMatch(JSON.stringify(r),/100%|天生一对|命中注定/);
});
test('匹配度等于八题相同选项的比例，0 到 100 有真实边界', () => {
  const other = a.answers.map((v,i) => (v+1)%F.questions[i].options.length);
  for (let same=0;same<=8;same++) {
    const answers = other.map((v,i) => i<same ? a.answers[i] : v);
    const expected = [0,13,25,38,50,63,75,88,100][same];
    const p = { name:'乙',answers };
    assert.deepEqual(F.matching(a,p),{ score:expected,same,total:8 });
    assert.equal(F.report(a,p).matchScore,expected);
    assert.equal(F.matching(p,a).score,expected);
  }
  assert.throws(()=>F.matching(a,{ name:'乙',answers:[0] }));
});
test('不同答案明确联系频率、玩笑和沟通方式的差异', () => {
  const r = F.report(a,b);
  assert.equal(r.sameCount,0);
  assert.equal(r.differences.length,7);
  assert.match(r.strengths[0].text,/没有在重点偏好上选到相同/);
  assert.match(r.differences.find(x => /联系/.test(x.title)).risk,/小林.*少联系.*阿圆.*频繁聊天/);
  assert.match(r.differences.find(x => /玩笑/.test(x.title)).advice,/更谨慎/);
  assert.ok(r.care[0].tips.some(x=>/日常/.test(x)));
  assert.ok(r.care[1].tips.some(x=>/空间/.test(x)));
});
test('交换两人次序不会改变相同数，各自照顾小抄跟随本人', () => {
  const r = F.report(a,b), s = F.report(b,a);
  assert.equal(r.sameCount,s.sameCount);
  assert.deepEqual(r.care[0],s.care[1]);
  assert.deepEqual(r.care[1],s.care[0]);
});
test('报告不修改输入；每条主要解读都指向实际选项', () => {
  const before = JSON.stringify([a,b]), r = F.report(a,b);
  assert.equal(JSON.stringify([a,b]),before);
  for (const item of [...r.strengths,...r.differences]) {
    assert.ok(item.basis.length);
    for (const basis of item.basis) {
      const qi = F.questions.findIndex(q => q.title === basis.question);
      assert.equal(basis.a,F.questions[qi].options[a.answers[qi]][0]);
      assert.equal(basis.b,F.questions[qi].options[b.answers[qi]][0]);
    }
  }
});
test('所有问题的任意选项组合都可生成并往返结果码', () => {
  for (let qi=0;qi<8;qi++) {
    for (let i=0;i<F.questions[qi].options.length;i++) {
      for (let j=0;j<F.questions[qi].options.length;j++) {
        const x = a.answers.slice(), y = a.answers.slice(); x[qi]=i; y[qi]=j;
        const p = F.profile('甲',x), q = F.profile('乙',y), r = F.report(p,q);
        assert.deepEqual(F.decode(F.encode(p)),p);
        assert.equal(r.sameCount,i===j?8:7);
        assert.equal(r.rows[qi].same,i===j);
        assert.equal(r.agreements.length,3);
      }
    }
  }
});
test('500 组跨题目答案可稳定生成完整说明书', () => {
  let seed = 48271;
  const rand = max => { seed = (Math.imul(seed,1664525)+1013904223)>>>0; return seed%max; };
  for (let i=0;i<500;i++) {
    const x = F.questions.map(q=>rand(q.options.length)), y = F.questions.map(q=>rand(q.options.length));
    const r = F.report({ name:'甲', answers:x },{ name:'乙',answers:y });
    assert.equal(r.sameCount,x.filter((v,k)=>v===y[k]).length);
    assert.ok(r.strengths.length);
    assert.equal(r.differences.length===0,r.sameCount===8);
    for(const item of r.differences) {
      assert.ok(item.risk && item.advice);
      assert.ok(item.risk.length<=80 && item.advice.length<=65);
      assert.ok(item.basis.every(row=>row.a!==row.b));
    }
    assert.equal(r.care.length,2);
    assert.doesNotMatch(JSON.stringify(r),/undefined|NaN/);
  }
});

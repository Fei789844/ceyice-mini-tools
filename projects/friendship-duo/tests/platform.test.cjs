const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const source=fs.readFileSync(require.resolve('../dist/platform.js'),'utf8');
function load(xhs,storage) {
  const context={ window:{ xhs }, localStorage:storage||{ getItem:()=>null,setItem(){},removeItem(){} } };
  vm.runInNewContext(source,context);
  return context.window.FriendshipPlatform;
}
test('原生存相册先把图片写为临时文件，只传官方声明的参数',async()=>{
  const calls=[];
  const p=load({miniTool:{
    writeTempFile:async o=>{calls.push(['write',o]);return {filePath:'tmp://photo.png'};},
    saveImageToPhotosAlbum:async o=>{calls.push(['save',o]);}
  }});
  assert.equal(await p.saveImage('data:image/png;base64,AAAA'),true);
  assert.equal(JSON.stringify(calls),JSON.stringify([['write',{data:'data:image/png;base64,AAAA'}],['save',{filePath:'tmp://photo.png'}]]));
});
test('不支持原生保存时返回降级；拒绝授权不伪报成功',async()=>{
  assert.equal(await load().saveImage('data:image/png;base64,AAAA'),false);
  const p=load({miniTool:{saveImageToPhotosAlbum:async()=>{throw new Error('denied');}}});
  await assert.rejects(p.saveImage('data:image/png;base64,AAAA'),/denied/);
});
test('支持版本优先使用原生缓存，不把头像写入浏览器后备存储',async()=>{
  const records=new Map();
  const fail=()=>{throw new Error('不应使用浏览器后备');};
  const p=load({launchOptions:{miniToolEnv:{buildVersion:9462004}},miniTool:{
    setStorage:async o=>records.set(o.key,o.data),getStorage:async o=>({data:records.get(o.key)||null}),removeStorage:async o=>records.delete(o.key)
  }},{getItem:fail,setItem:fail,removeItem:fail});
  assert.equal(await p.set('photo',{name:'测试',photo:'local image'}),true);
  assert.equal(JSON.stringify(await p.get('photo')),JSON.stringify({name:'测试',photo:'local image'}));
  await p.remove('photo');assert.equal(await p.get('photo'),null);
});
test('低版本缓存失效时可继续使用应用，不假装进度已保存',async()=>{
  const p=load({launchOptions:{miniToolEnv:{buildVersion:9450001}},miniTool:{getStorage:async()=>({data:'{}'}),setStorage:async()=>{throw new Error('不应调用');}}},{getItem:()=>{throw new Error('blocked');},setItem:()=>{throw new Error('full');},removeItem(){}});
  assert.equal(await p.get('draft'),null);assert.equal(await p.set('draft',{}),false);
});

/* Portfolio-only interactions. No network calls, persistence, or model inference. */
const examples = [
  {id:'DEMO-01',title:'公开核验：先固定说法，再展示凭证',tags:['公开','核验','证据','署名'],goal:'让实际创作者拿回作品署名。',action:'让对方先陈述创作过程，再按时间顺序展示制作底稿。',chain:'署名被替换 → 对方声称独立完成 → 原始记录公开核验 → 更正署名',origin:'本次新写的抽象机制示例，非历史语料摘录。'},
  {id:'DEMO-02',title:'清算退出：把付出逐项变成账目',tags:['清算','退出','投入','账本'],goal:'结束持续被占用的劳动关系。',action:'列出垫付款、自有工具与未授权作品，分别交接和收回。',chain:'投入被视为理所当然 → 新增任务遭拒 → 账目与物品分别交接 → 退出不再反复',origin:'本次新写的抽象机制示例，非历史语料摘录。'},
  {id:'DEMO-03',title:'职业重建：让新的生活兑现离开',tags:['职业','重建','新生','成果'],goal:'从被否定的角色转向可见的职业身份。',action:'通过独立完成的作品和客户回访，呈现新的工作秩序。',chain:'旧关系否定价值 → 独立接下小项目 → 交付解决具体问题 → 以工作成果收尾',origin:'本次新写的抽象机制示例，非历史语料摘录。'},
  {id:'DEMO-04',title:'秘密推进：知情范围改变选择',tags:['秘密','信息差','关系','选择'],goal:'让秘密的揭露改变人物下一步行动。',action:'记录谁见过证据、谁只听到转述，再设计有代价的告知时机。',chain:'观众知道秘密 → 主角误判对手 → 关键知情者提出交换 → 主角选择承担公开代价',origin:'本次新写的抽象机制示例，非历史语料摘录。'},
  {id:'DEMO-05',title:'规则前置：反转依赖提前出现的条件',tags:['规则','伏笔','反转','核验'],goal:'让解决方案来自故事已有条件。',action:'在冲突之前交代申请规则和原始编号，再让主角在限时内申请核验。',chain:'规则在开场出现 → 对手利用流程空隙 → 主角补足凭证 → 已有规则兑现',origin:'本次新写的抽象机制示例，非历史语料摘录。'},
  {id:'DEMO-06',title:'利益升级：每次行动都改变局面',tags:['利益','升级','阻力','行动'],goal:'防止冲突只重复同一种羞辱。',action:'将阻力从一次署名争议升级为后续授权，再让主角调整目标。',chain:'要求更正展牌 → 发现长期授权风险 → 转为保护原始材料 → 拒绝以复合作为交换',origin:'本次新写的抽象机制示例，非历史语料摘录。'}
];
const $ = id => document.getElementById(id);
const engine=window.portfolioEngine;
const original=$('original'),graded=$('graded');
const ctx=original.getContext('2d',{willReadFrequently:true});
let preset='warm';let photoData;
function drawScene(){
  original.width=600;original.height=470;
  const sky=ctx.createLinearGradient(0,0,0,470);sky.addColorStop(0,'#99b9c7');sky.addColorStop(.64,'#dfe2cd');sky.addColorStop(1,'#b4bd9c');ctx.fillStyle=sky;ctx.fillRect(0,0,600,470);
  ctx.fillStyle='#f2e5b2';ctx.beginPath();ctx.arc(432,97,43,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#84988a';ctx.beginPath();ctx.moveTo(0,280);[[80,166],[155,246],[280,130],[412,265],[505,197],[600,270],[600,470],[0,470]].forEach(p=>ctx.lineTo(...p));ctx.closePath();ctx.fill();
  ctx.fillStyle='#607e6d';ctx.beginPath();ctx.moveTo(0,326);ctx.bezierCurveTo(150,215,250,358,600,276);ctx.lineTo(600,470);ctx.lineTo(0,470);ctx.fill();
  ctx.fillStyle='#b9b6a4';ctx.beginPath();ctx.moveTo(300,300);ctx.lineTo(340,300);ctx.lineTo(425,470);ctx.lineTo(231,470);ctx.fill();
  ctx.fillStyle='#d6ccad';ctx.fillRect(142,252,130,104);ctx.fillStyle='#795e4d';ctx.beginPath();ctx.moveTo(125,255);ctx.lineTo(206,201);ctx.lineTo(288,255);ctx.fill();
  ctx.fillStyle='#45564a';ctx.fillRect(195,300,29,56);ctx.fillRect(157,274,23,26);ctx.fillRect(236,274,23,26);
  for(const [x,y,r]of[[65,300,37],[105,336,29],[466,335,43],[529,315,32],[500,390,32]]){ctx.fillStyle='#554e38';ctx.fillRect(x-4,y,8,70);ctx.fillStyle='#3f6650';ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
  ctx.fillStyle='#c1c79e';for(let i=0;i<90;i++){const x=(i*73+17)%600,y=370+(i*43)%100;if(x<210||x>435){ctx.beginPath();ctx.ellipse(x,y,2,5,.4,0,Math.PI*2);ctx.fill();}}
  photoData=ctx.getImageData(0,0,original.width,original.height);$('image-source').textContent='程序绘制示意场景';renderColor();
}
function renderColor(){
  const r=engine.neutral();
  if(preset==='warm'){r.temperature=.29;r.tint=.025;r.exposure=.13;r.contrast=1.08;r.saturation=.94;r.shadow_tint=[-.015,.008,.016];r.highlight_tint=[.027,.009,-.022];}
  if(preset==='cool'){r.temperature=-.32;r.tint=-.055;r.contrast=1.12;r.saturation=.82;r.shadow_tint=[-.035,.018,.04];r.highlight_tint=[-.008,.012,.018];}
  if(preset==='soft'){r.temperature=.09;r.exposure=.2;r.contrast=.85;r.saturation=.75;r.tone_curve=[.04,.28,.52,.76,.97];}
  const strength=Number($('strength').value)/100;$('strength-label').textContent=Math.round(strength*100)+'%';
  const pixels=engine.renderPixels(photoData.data.slice().buffer,engine.recipeAtStrength(r,strength,strength),1);
  graded.width=original.width;graded.height=original.height;graded.getContext('2d').putImageData(new ImageData(pixels,graded.width,graded.height),0,0);
}
document.querySelectorAll('[data-preset]').forEach(b=>b.addEventListener('click',()=>{preset=b.dataset.preset;document.querySelectorAll('[data-preset]').forEach(p=>{p.classList.toggle('active',p===b);p.setAttribute('aria-pressed',String(p===b));});renderColor();}));
$('strength').addEventListener('input',renderColor);
let uploadEpoch=0;
$('color-reset').addEventListener('click',()=>{uploadEpoch++;$('photo-input').value='';drawScene();$('color-status').textContent='已恢复示意图。上传图片仅在本页处理，不发送到服务器。';});
$('photo-input').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;const epoch=++uploadEpoch;if(file.size>30*1024*1024){$('color-status').textContent='请选择 30 MB 以内的图片。';return;}let bitmap;try{
  bitmap=await createImageBitmap(file);if(epoch!==uploadEpoch)return;const scale=Math.min(1,1000/Math.max(bitmap.width,bitmap.height));original.width=Math.max(1,Math.round(bitmap.width*scale));original.height=Math.max(1,Math.round(bitmap.height*scale));ctx.drawImage(bitmap,0,0,original.width,original.height);photoData=ctx.getImageData(0,0,original.width,original.height);$('image-source').textContent='我的图片 · 本地处理';$('color-status').textContent='仅本地预览；最长边缩放至 1000 像素。不保留 EXIF / HDR，下载为预览尺寸 PNG。';renderColor();
}catch{if(epoch===uploadEpoch)$('color-status').textContent='无法读取这张图片，请选择浏览器支持的 JPG、PNG 或 WebP。';}finally{bitmap?.close();}});
function saveBlob(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('download-image').addEventListener('click',()=>graded.toBlob(blob=>{if(blob)saveBlob(blob,'shise-local-preview.png');}));
function inspectScript(text){
  const lines=text.split(/\r?\n/);const heads=lines.map((value,i)=>({value:value.trim(),line:i+1})).filter(x=>/^\d+[-－]\d+/.test(x.value));
  const checks=[
    {name:'集标题',pass:lines.some(s=>/^第\s*\d+\s*集/.test(s.trim())),detail:'需要“第1集”形式的标题'},
    {name:'场次编号',pass:heads.length>0,detail:'需要“1-1”形式的场次行'},
    {name:'场景时间与内外景',pass:heads.length>0&&heads.every(x=>/日|夜|晨|昏/.test(x.value)&&/内|外/.test(x.value)),detail:heads.filter(x=>!(/日|夜|晨|昏/.test(x.value)&&/内|外/.test(x.value))).map(x=>'第 '+x.line+' 行缺少时间或内外景').join('；')||'场景行应包括时间与内外景'},
    {name:'人物表',pass:lines.some(s=>/^人物[：:]/.test(s.trim())),detail:'需要“人物：”行'},
    {name:'可视化动作标记',pass:lines.some(s=>/^▲/.test(s.trim())),detail:'需要至少一行“▲”开头的动作'},
    {name:'角色对白',pass:lines.some(s=>/^[\u4e00-\u9fffA-Za-z]{1,16}(?:[（(].*?[）)])?[：:]\s*\S/.test(s.trim())&&!/^人物[：:]/.test(s.trim())),detail:'需要角色名与冒号后的对白'}
  ];
  return{mode:'local-format-demo',checks,summary:checks.filter(c=>c.pass).length+'/'+checks.length+' 项格式检查通过',note:'只检查本页列出的格式规则，不判断戏剧质量、集尾效果或连续性。'};
}
let lastReport;
function checkScript(){lastReport=inspectScript($('script-input').value);const target=$('qa-result');target.replaceChildren();for(const c of lastReport.checks){const row=document.createElement('div');row.className='check-row';const label=document.createElement('span');label.textContent=c.name;const result=document.createElement('span');result.className=c.pass?'pass':'fail';result.textContent=c.pass?'✓ 通过':'需补充';row.append(label,result);target.append(row);if(!c.pass){const note=document.createElement('p');note.className='qa-note';note.textContent=c.detail;target.append(note);}}const summary=document.createElement('p');summary.className='qa-note';summary.textContent=lastReport.summary+'。'+lastReport.note;target.prepend(summary);}
$('check-script').addEventListener('click',checkScript);
$('download-report').addEventListener('click',()=>{checkScript();saveBlob(new Blob([JSON.stringify(lastReport,null,2)],{type:'application/json'}),'script-format-report.json');});
function searchFactors(){const words=$('factor-search').value.trim().toLowerCase().split(/\s+/).filter(Boolean);const results=examples.filter(x=>words.every(w=>JSON.stringify(x).toLowerCase().includes(w)));$('factor-count').textContent='找到 '+results.length+' / '+examples.length+' 条演示记录';const target=$('factor-results');target.replaceChildren();for(const x of results){const card=document.createElement('article');card.className='factor-card';const h=document.createElement('h4');h.textContent=x.title;const p=document.createElement('p');p.textContent=x.chain;const p2=document.createElement('p');p2.textContent='行动：'+x.action;const small=document.createElement('small');small.textContent=x.id+' · '+x.tags.join(' / ')+' · 本次原创样例';card.append(h,p,p2,small);target.append(card);}if(!results.length){const p=document.createElement('p');p.className='empty';p.textContent='没有匹配记录。试试减少关键词，或查看全部六条样例。';target.append(p);}}
$('factor-search').addEventListener('input',searchFactors);
document.querySelectorAll('[data-query]').forEach(b=>b.addEventListener('click',()=>{$('factor-search').value=b.dataset.query;searchFactors();}));
drawScene();checkScript();searchFactors();

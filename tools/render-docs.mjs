import {readFile,writeFile,readdir} from 'node:fs/promises';
const root=new URL('../docs/',import.meta.url);
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const inline=s=>escape(s).replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/\[([^\]]+)\]\(([^)]+)\)/g,(_,label,url)=>'<a href="'+url.replace(/\.md(?=$|#)/,'.html')+'">'+label+'</a>');
for(const name of await readdir(root)){if(!name.endsWith('.md'))continue;const md=await readFile(new URL(name,root),'utf8');const lines=md.split(/\r?\n/);let out='',code=false,list=false,table=false;
for(const line of lines){
  if(line.startsWith('```')){if(list){out+='</ul>';list=false;}out+=code?'</code></pre>':'<pre><code>';code=!code;continue;}
  if(code){out+=escape(line)+'\n';continue;}
  if(line.startsWith('|')){if(!table){out+='<div class="table-scroll"><table>';table=true;}if(/^\|[\s:|\-]+$/.test(line))continue;out+='<tr>'+line.split('|').slice(1,-1).map(s=>'<td>'+inline(s.trim())+'</td>').join('')+'</tr>';continue;}
  if(table){out+='</table></div>';table=false;}
  if(/^[-] /.test(line)){if(!list){out+='<ul>';list=true;}out+='<li>'+inline(line.slice(2))+'</li>';continue;}
  if(list){out+='</ul>';list=false;}const h=/^(#{1,3}) (.*)$/.exec(line);if(h){out+='<h'+h[1].length+'>'+inline(h[2])+'</h'+h[1].length+'>';continue;}if(line.trim())out+='<p>'+inline(line)+'</p>';
}
if(list)out+='</ul>';if(table)out+='</table></div>';const title=lines.find(x=>x.startsWith('# '))?.slice(2)||'项目说明';
await writeFile(new URL(name.replace('.md','.html'),root),'<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+escape(title)+' · 邵保瑞</title><link rel="stylesheet" href="../assets/style.css"><style>.doc{max-width:900px;padding-top:50px;padding-bottom:70px}.doc h1{font-size:38px;margin:30px 0}.doc h2{font-size:24px;margin:40px 0 16px}.doc p{margin:17px 0}.doc ul{padding-left:22px;color:var(--muted)}.doc li{margin:8px 0}.doc a{text-decoration:underline;text-underline-offset:4px}.doc code{font-size:12px;background:#e7eadc;padding:2px 4px}.doc pre{background:#e7eadc;padding:20px;overflow-x:auto;line-height:1.8}.doc pre code{padding:0}.table-scroll{overflow-x:auto}table{border-collapse:collapse;width:100%;font-size:13px}td{border-bottom:1px solid var(--line);padding:10px;text-align:left}tr:first-child{font-weight:700;background:#e8ecde}@media(max-width:600px){.doc h1{font-size:29px}}</style></head><body><header class="nav wrap"><a class="brand" href="../index.html">← 邵保瑞 / 项目档案</a><a href="https://github.com/uo13/ai-project-demos">GitHub ↗</a></header><main class="wrap doc"><div class="eyebrow">PROJECT NOTES / 2026.10.17</div>'+out+'<p><a href="../index.html#projects">← 返回作品集</a></p></main></body></html>');
}
console.log('Rendered project notes as standalone HTML.');

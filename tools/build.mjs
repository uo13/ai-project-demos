import {mkdir,cp,copyFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
await mkdir(root+'_site/demos/shise',{recursive:true});
for(const file of ['index.html','cases.html','.nojekyll'])await copyFile(root+file,root+'_site/'+file);
for(const dir of ['assets','data','docs'])await cp(root+dir,root+'_site/'+dir,{recursive:true});
await copyFile(root+'demos/shise/index.html',root+'_site/demos/shise/index.html');
await cp(root+'demos/story-lab',root+'_site/demos/story-lab',{recursive:true});
console.log('Static Pages output: _site/');

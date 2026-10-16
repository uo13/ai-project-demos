import {readFile,writeFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);const files={agent:'hualing-audit.json',guard:'hualing-guard-audit.json',routing:'hualing-routing-audit.json',stories:'story-audit.json',retrieval:'story-retrieval-audit.json',schema:'story-record.schema.json',sample:'story-sample.json'};const data={};
for(const [key,file]of Object.entries(files))data[key]=JSON.parse(await readFile(new URL('data/'+file,root),'utf8'));
const validator=(await readFile(new URL('demos/story-lab/validator.mjs',root),'utf8')).replaceAll('export function ','function ');
await writeFile(new URL('assets/evidence-data.js',root),'// Generated only from public evidence JSON and the public validator.\nwindow.caseEvidence='+JSON.stringify(data).replaceAll('<','\\u003c')+';\n(()=>{\n'+validator+'\nwindow.caseValidator={validateSchema,validateRecord};\n})();\n');
console.log('Prepared browser evidence bundle.');

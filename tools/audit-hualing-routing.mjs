// Run the existing 21 assertions without overwriting the historical report.
// node tools/audit-hualing-routing.mjs PRIVATE_HUALING_ROOT data/hualing-routing-audit.json
// Needs npm access to the tsx package. Private sources stay on this machine.
import {readFile,writeFile,mkdtemp,access} from 'node:fs/promises';
import {resolve,dirname,join} from 'node:path';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const [sourceRoot,output]=process.argv.slice(2);if(!sourceRoot||!output)throw Error('Pass private Hualing root and output JSON path');
const frontend=resolve(sourceRoot,'hualing-frontend');const original=join(frontend,'scripts/test-playground-resolution.ts');const source=await readFile(original,'utf8');const temp=await mkdtemp(join(tmpdir(),'portfolio-hualing-routing-'));
let runner=source.replace(/from\s+(['"])(\.\.?\/[^'"]+)\1/g,(_,q,p)=>'from '+q+pathToFileURL(resolve(dirname(original),p)).href+q);
runner=runner.replace(/const outputDir = [^;]+;/,'const outputDir = '+JSON.stringify(temp)+';');const runnerPath=join(temp,'audit.mts');await writeFile(runnerPath,runner);
const npmCandidates=[join(dirname(process.execPath),'node_modules/npm/bin/npx-cli.js'),join(dirname(process.execPath),'../lib/node_modules/npm/bin/npx-cli.js')];
let npmCli;for(const candidate of npmCandidates){try{await access(candidate);npmCli=candidate;break;}catch{}}
const result=npmCli?spawnSync(process.execPath,[npmCli,'--yes','--package=tsx','tsx',runnerPath],{encoding:'utf8',timeout:120000}):spawnSync('npx',['--yes','--package=tsx','tsx',runnerPath],{encoding:'utf8',timeout:120000});
if(result.status!==0)throw Error((result.stderr||result.stdout||String(result.error)).slice(-2000));
const report=JSON.parse(await readFile(join(temp,'playground-runtime-resolution.json'),'utf8'));const hash=b=>createHash('sha256').update(b).digest('hex');
const files=['scripts/test-playground-resolution.ts','lib/unifiedPlayDefinition.ts','src/features/playground/configs/playItems.ts','src/features/entertainment-tests/configIndex.ts','lib/externalTestRegistry.ts'];
report.audit_date='2026-10-17';report.method='Existing assertion script executed unchanged except absolute import resolution and temporary report destination. No UI build, model API or database invoked.';report.source_files=await Promise.all(files.map(async p=>({path:'hualing-frontend/'+p,sha256:hash(await readFile(join(frontend,p)))})));report.limits=['21 assertions cover configuration resolution, not all 67 interactive flows.','Historical frontend report had 84 existing TypeScript errors; no full build rerun in this audit.'];
await writeFile(resolve(output),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({summary:report.summary,counts:report.counts}));

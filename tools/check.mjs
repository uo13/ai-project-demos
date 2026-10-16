import {readFile,readdir,stat} from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {resolve,dirname,extname} from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const html=await readFile(root+'index.html','utf8');
const app=await readFile(root+'assets/app.js','utf8');
const engine=await readFile(root+'assets/color-engine.js','utf8');
for(const js of [app,engine])new vm.Script(js);
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size,'Unique element IDs');
for(const m of app.matchAll(/\$\('([^']+)'\)/g))assert(ids.includes(m[1]),'Element exists: '+m[1]);
for(const m of html.matchAll(/(?:href|src)="([^"]+)"/g)){if(/^(?:https?:|data:|#)/.test(m[1]))continue;await stat(resolve(root,m[1].split('#')[0]));}
const context=vm.createContext({window:{},Uint8ClampedArray,Float32Array,structuredClone});vm.runInContext(engine,context);const e=context.window.portfolioEngine;
const pixels=new Uint8ClampedArray([0,0,0,0,12,87,160,255,255,255,255,73]);assert.deepEqual(e.renderPixels(pixels.slice().buffer,e.neutral(),1),pixels,'Extracted renderer neutral parity');
const r=e.neutral();r.temperature=.3;r.contrast=1.1;assert.deepEqual(e.renderPixels(pixels.slice().buffer,e.recipeAtStrength(r,0,0),1),pixels,'Extracted renderer zero strength');
assert(!/fetch\(|localStorage|sessionStorage|indexedDB|https?:\/\//.test(app),'Portfolio interactions stay local');
const json=JSON.parse(await readFile(root+'data/factors-demo.json','utf8'));assert.equal(json.length,6);const exampleContext=vm.createContext({});vm.runInContext(app.slice(0,app.indexOf('const $ ='))+';this.examples=examples;',exampleContext);assert.equal(JSON.stringify(exampleContext.examples),JSON.stringify(json),'Displayed samples match downloadable JSON');
const metrics=JSON.parse(await readFile(root+'data/story-metrics.json','utf8'));assert.equal(metrics.covered,185);assert.equal(metrics.original_pool,522);assert.equal(metrics.quote_ok,3083);
const files=[];async function walk(dir){for(const name of await readdir(dir)){if(['.git','_site','node_modules','__pycache__'].includes(name))continue;const path=resolve(dir,name);if((await stat(path)).isDirectory())await walk(path);else files.push(path);}}await walk(root);
for(const file of files){if(['.jpg','.jpeg','.png'].includes(extname(file)))continue;const text=await readFile(file,'utf8');assert(!/sk-[a-zA-Z0-9]{20,}|gh[pousr]_[a-zA-Z0-9]{25,}|github_pat_[a-zA-Z0-9_]{25,}|BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY/.test(text),'No embedded credential: '+file);assert(!/C:\\Users\\sbrg|wxid_[a-zA-Z0-9_]+/.test(text),'No private local paths: '+file);}
console.log('Delivery checks passed: '+files.length+' files; scripts, links, renderer, metrics, sample parity and credential scan.');

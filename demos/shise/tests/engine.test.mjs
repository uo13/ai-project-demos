import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const section=(start,end)=>{const a=html.indexOf(start),b=html.indexOf(end,a);assert(a>=0&&b>a,'Production section exists');return html.slice(a,b);};
const context=vm.createContext({Uint8ClampedArray,Float32Array,structuredClone});
const code=section('const neutral=','const state=')+section('function strictJSON(','const SYSTEM=')+section('function renderPixels(','const workerURL=')+';globalThis.engine={neutral,strictJSON,validatePlan,renderPixels,recipeAtStrength};';
vm.runInContext(code,context,{timeout:5000});
const {neutral,strictJSON,validatePlan,renderPixels,recipeAtStrength}=context.engine;

test('Complete single-file entry compiles without private local URLs',()=>{
  const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];assert.equal(scripts.length,1);
  new Function(scripts[0][1]);
  assert(!/127\.0\.0\.1|localhost|[A-Z]:[\\/]/.test(html));
  assert(html.includes('web_color_v2'));
  assert(!/localStorage|sessionStorage|indexedDB/.test(html));
});
test('Neutral and zero strength preserve pixels including alpha',()=>{
  const input=new Uint8ClampedArray([0,0,0,255,128,80,155,73,255,255,255,255]);
  assert.deepEqual(renderPixels(input.buffer,neutral(),1),input);
  const r=neutral();r.exposure=1;r.temperature=.5;
  assert.deepEqual(renderPixels(input.buffer,r,0),input);
});
test('HSL can change green while leaving red and gray intact',()=>{
  const input=new Uint8ClampedArray([255,0,0,255,0,180,0,128,128,128,128,255]);const r=neutral();r.hsl[3]=[-30,.65,-.1];
  const out=renderPixels(input.buffer,r,1);
  assert.deepEqual(out.slice(0,4),input.slice(0,4));assert.deepEqual(out.slice(8),input.slice(8));assert(out[4]>0&&out[5]<180);assert.equal(out[7],128);
});
test('Tonal curve stays monotonic at 200% without tinting gray',()=>{
  const input=new Uint8ClampedArray(Array.from({length:256},(_,i)=>[i,i,i,255]).flat());const r=neutral();r.tone_curve=[.02,.16,.45,.82,.97];
  for(const amount of [1,2]){const out=renderPixels(input.buffer,recipeAtStrength(r,amount,1),1);for(let i=0;i<out.length;i+=4){assert.equal(out[i],out[i+1]);assert.equal(out[i],out[i+2]);if(i)assert(out[i]>=out[i-4]);}}
});
test('Independent controls remove tone and color edits at zero',()=>{
  const r=neutral();r.temperature=.8;r.contrast=1.3;r.shadow_tint=[.05,0,-.05];r.hsl[3]=[15,.7,-.1];
  const result=recipeAtStrength(r,0,0),input=new Uint8ClampedArray([120,140,170,255]);
  assert.deepEqual(renderPixels(input.buffer,result,1),input);
  const colorOnly=recipeAtStrength(r,0,1);assert.equal(colorOnly.contrast,1);assert.equal(colorOnly.temperature,.8);
});
test('Duplicate fields, mismatched IDs and malformed recipes are rejected',()=>{
  assert.throws(()=>strictJSON('{"a":1,"a":2}'));
  const ids={request_id:'r',source_id:'s',reference_id:'f'};
  const plan=()=>({version:'web_color_v2',...ids,status:'ok',confidence:'medium',recipe:neutral(),notes:[]});
  validatePlan(plan(),ids);
  for(const fault of ['id','curve','hsl','missing','unknown','unsupported']){
    const p=plan();
    if(fault==='id')p.source_id='different';
    if(fault==='curve')p.recipe.tone_curve=[0,.6,.5,.8,1];
    if(fault==='hsl')p.recipe.hsl[0][0]=90;
    if(fault==='missing')delete p.recipe.midtone_tint;
    if(fault==='unknown')p.recipe.extra=1;
    if(fault==='unsupported'){p.status='unsupported';p.confidence='low';p.recipe.exposure=.3;}
    assert.throws(()=>validatePlan(p,ids),fault);
  }
});

import {readFile,writeFile} from 'node:fs/promises';
const html=await readFile(new URL('../demos/shise/index.html',import.meta.url),'utf8');
const part=(start,end)=>{const a=html.indexOf(start),b=html.indexOf(end,a);if(a<0||b<=a)throw Error('Source boundary missing');return html.slice(a,b);};
const code=part('const neutral=','const state=')+part('function strictJSON(','const SYSTEM=')+part('function renderPixels(','const workerURL=');
await writeFile(new URL('../assets/color-engine.js',import.meta.url),'/* Extracted from the existing Shise 2.0 renderer. See docs/sources.md. */\n(()=>{\n'+code+'\nwindow.portfolioEngine={neutral,recipeAtStrength,renderPixels};\n})();\n');
console.log('Extracted original renderer without API code.');

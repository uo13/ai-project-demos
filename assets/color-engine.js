/* Extracted from the existing Shise 2.0 renderer. See docs/sources.md. */
(()=>{
const neutral=()=>({exposure:0,contrast:1,saturation:1,temperature:0,tint:0,shadows:0,highlights:0,gamma:1,fade:0,vibrance:0,shadow_tint:[0,0,0],highlight_tint:[0,0,0],midtone_tint:[0,0,0],tone_curve:[0,.25,.5,.75,1],hsl:Array.from({length:8},()=>[0,1,0])});
const ranges={exposure:[-2,2],contrast:[.5,1.8],saturation:[0,2],temperature:[-1.2,1.2],tint:[-.8,.8],shadows:[-1,1],highlights:[-1,1],gamma:[.6,1.6],fade:[0,.2],vibrance:[-.8,.8]};
function strictJSON(text){let p=0;function ws(){while(/\s/.test(text[p]||'')&&p<text.length)p++;}function str(){const start=p++;while(p<text.length){if(text[p]==='\\'){p+=2;continue;}if(text[p++]==='"')return JSON.parse(text.slice(start,p));}throw Error('JSON字符串不完整');}function value(depth=0){if(depth>30)throw Error('JSON层级过深');ws();const ch=text[p];if(ch==='"')return str();if(ch==='{'){p++;const obj=Object.create(null);ws();if(text[p]==='}'){p++;return obj;}while(true){ws();if(text[p]!=='"')throw Error('JSON字段无效');let k=str();if(Object.hasOwn(obj,k))throw Error('API 返回了重复字段');ws();if(text[p++]!==':')throw Error('JSON格式无效');obj[k]=value(depth+1);ws();let end=text[p++];if(end==='}')return obj;if(end!==',')throw Error('JSON对象不完整');}}if(ch==='['){p++;const arr=[];ws();if(text[p]===']'){p++;return arr;}while(true){arr.push(value(depth+1));ws();const end=text[p++];if(end===']')return arr;if(end!==',')throw Error('JSON数组不完整');}}const match=text.slice(p).match(/^(?:true|false|null|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)/);if(!match)throw Error('JSON内容无效');p+=match[0].length;const v=JSON.parse(match[0]);if(typeof v==='number'&&!Number.isFinite(v))throw Error('API 返回了无效数字');return v;}const result=value();ws();if(p!==text.length)throw Error('API 返回了JSON以外的内容');return result;}
function exactKeys(obj,keys){if(!obj||typeof obj!=='object'||Array.isArray(obj)||Object.keys(obj).length!==keys.length||!keys.every(k=>Object.hasOwn(obj,k)))throw Error('API 返回字段不完整或包含未知字段，请重试。');}
function validatePlan(plan,context){exactKeys(plan,['version','request_id','source_id','reference_id','status','confidence','recipe','notes']);if(plan.version!=='web_color_v2')throw Error('API返回了不兼容的调色方案。');for(const key of ['request_id','source_id','reference_id'])if(plan[key]!==context[key])throw Error('图片已经改变，请重新生成。');if(!['ok','conservative','unsupported'].includes(plan.status)||!['low','medium','high'].includes(plan.confidence))throw Error('API返回了无效状态。');exactKeys(plan.recipe,Object.keys(neutral()));for(const [key,[min,max]]of Object.entries(ranges)){let v=plan.recipe[key];if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max)throw Error('调色参数超出范围：'+key);}for(const key of ['shadow_tint','midtone_tint','highlight_tint']){const v=plan.recipe[key];if(!Array.isArray(v)||v.length!==3||!v.every(x=>typeof x==='number'&&Number.isFinite(x)&&Math.abs(x)<=.18))throw Error('API返回了无效的分离色调。');}const curve=plan.recipe.tone_curve;if(!Array.isArray(curve)||curve.length!==5||!curve.every((v,i)=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=1&&(i===0||v-curve[i-1]>=.02)))throw Error('API返回了无效或反转的影调曲线。');const hsl=plan.recipe.hsl;if(!Array.isArray(hsl)||hsl.length!==8||!hsl.every(row=>Array.isArray(row)&&row.length===3&&row.every(v=>typeof v==='number'&&Number.isFinite(v))&&Math.abs(row[0])<=45&&row[1]>=0&&row[1]<=2&&Math.abs(row[2])<=.25))throw Error('API返回了无效的分色参数。');if(!Array.isArray(plan.notes)||plan.notes.length>4||!plan.notes.every(v=>typeof v==='string'&&v.length<=200))throw Error('API返回了无效说明。');if(plan.status==='unsupported'){const n=neutral();if(plan.confidence!=='low'||Object.keys(n).some(k=>JSON.stringify(n[k])!==JSON.stringify(plan.recipe[k])))throw Error('无法执行的方案必须保持中性。');}return plan;}
function renderPixels(input,recipe,strength){
  const src=new Uint8ClampedArray(input),out=new Uint8ClampedArray(src.length);
  const clamp=x=>Math.max(0,Math.min(1,x));
  strength=Math.max(0,Math.min(1,strength));
  if(strength===0){out.set(src);return out;}
  const points=recipe.tone_curve||[0,.25,.5,.75,1],hsl=recipe.hsl||Array.from({length:8},()=>[0,1,0]),mt=recipe.midtone_tint||[0,0,0];
  const curveActive=points.some((v,i)=>Math.abs(v-i/4)>1e-8),hslActive=hsl.some(v=>v[0]!==0||v[1]!==1||v[2]!==0);
  const neutralRecipe=recipe.exposure===0&&recipe.temperature===0&&recipe.tint===0&&recipe.shadows===0&&recipe.highlights===0&&recipe.contrast===1&&recipe.gamma===1&&recipe.saturation===1&&recipe.vibrance===0&&recipe.fade===0&&recipe.shadow_tint.every(x=>x===0)&&recipe.highlight_tint.every(x=>x===0)&&mt.every(x=>x===0)&&!curveActive&&!hslActive;
  if(neutralRecipe){out.set(src);return out;}
  const linear=new Float32Array(256),encoded=new Float32Array(8193);
  for(let i=0;i<256;i++){const x=i/255;linear[i]=x<=.04045?x/12.92:((x+.055)/1.055)**2.4;}
  for(let i=0;i<encoded.length;i++){const x=i/8192;encoded[i]=x<=.0031308?12.92*x:1.055*x**(1/2.4)-.055;}
  const srgb=x=>encoded[Math.round(clamp(x)*8192)];
  // Shape-preserving cubic interpolation; no overshoot between curve knots.
  const d=points.slice(1).map((v,i)=>(v-points[i])*4),m=[d[0],0,0,0,d[3]];
  for(let i=1;i<4;i++)m[i]=d[i-1]*d[i]>0?2*d[i-1]*d[i]/(d[i-1]+d[i]):0;
  const tone=new Float32Array(4097);
  for(let i=0;i<=4096;i++){const x=i/4096,k=Math.min(3,Math.floor(x*4)),t=x*4-k,t2=t*t,t3=t2*t;tone[i]=(2*t3-3*t2+1)*points[k]+(t3-2*t2+t)*m[k]/4+(-2*t3+3*t2)*points[k+1]+(t3-t2)*m[k+1]/4;}
  const anchors=[0,30,60,120,180,240,270,300,360],hueTable=new Float32Array(360*3);
  for(let h=0;h<360;h++){let k=0;while(k<7&&h>=anchors[k+1])k++;let t=(h-anchors[k])/(anchors[k+1]-anchors[k]);t=t*t*(3-2*t);for(let j=0;j<3;j++)hueTable[h*3+j]=hsl[k][j]*(1-t)+hsl[(k+1)%8][j]*t;}
  let wr=Math.exp(.3*recipe.temperature+.12*recipe.tint),wg=Math.exp(-.24*recipe.tint),wb=Math.exp(-.3*recipe.temperature+.12*recipe.tint);
  const norm=.2126*wr+.7152*wg+.0722*wb;wr/=norm;wg/=norm;wb/=norm;
  const exp=2**recipe.exposure,linearActive=recipe.exposure!==0||recipe.temperature!==0||recipe.tint!==0||recipe.shadows!==0||recipe.highlights!==0;
  for(let i=0;i<src.length;i+=4){
    let r=src[i]/255,g=src[i+1]/255,b=src[i+2]/255,y;
    if(linearActive){
      r=linear[src[i]]*exp*wr;g=linear[src[i+1]]*exp*wg;b=linear[src[i+2]]*exp*wb;
      y=.2126*r+.7152*g+.0722*b;let cy=clamp(y),target=Math.max(0,y+recipe.shadows*.18*(1-cy)**3*y/(y+.02)+recipe.highlights*.25*cy**3),gain=y>1e-8?target/y:1;
      r=srgb(r*gain);g=srgb(g*gain);b=srgb(b*gain);
    }
    y=.2126*r+.7152*g+.0722*b;
    let target=clamp((y-.5)*recipe.contrast+.5)**recipe.gamma;
    if(curveActive){const f=clamp(target)*4096,k=Math.min(4095,Math.floor(f)),t=f-k;target=tone[k]*(1-t)+tone[k+1]*t;}
    if(y>1e-8){const gain=target/y;r*=gain;g*=gain;b*=gain;}else r=g=b=target;
    // Compress chroma around the target luma before HSL conversion.
    let peak=Math.max(r,g,b),low=Math.min(r,g,b),scale=1;
    if(peak>1&&peak>target)scale=Math.min(scale,(1-target)/(peak-target));
    if(low<0&&target>low)scale=Math.min(scale,target/(target-low));
    r=clamp(target+(r-target)*scale);g=clamp(target+(g-target)*scale);b=clamp(target+(b-target)*scale);
    if(hslActive){
      const max=Math.max(r,g,b),min=Math.min(r,g,b),delta=max-min;let l=(max+min)/2;
      if(delta>1e-8){
        let sat=delta/(1-Math.abs(2*l-1)),h=max===r?((g-b)/delta+6)%6:max===g?(b-r)/delta+2:(r-g)/delta+4;
        const originalHue=h*60,h0=Math.floor(originalHue)%360,h1=(h0+1)%360,ht=originalHue-Math.floor(originalHue);
        const dh=hueTable[h0*3]*(1-ht)+hueTable[h1*3]*ht,ds=hueTable[h0*3+1]*(1-ht)+hueTable[h1*3+1]*ht,dl=hueTable[h0*3+2]*(1-ht)+hueTable[h1*3+2]*ht;
        const chromaWeight=Math.min(1,sat/.2);h=((originalHue+dh*chromaWeight+360)%360)/60;
        l=clamp(l+dl*2*Math.min(l,1-l)*chromaWeight);sat=clamp(sat*ds);
        const c=(1-Math.abs(2*l-1))*sat,x=c*(1-Math.abs(h%2-1)),base=l-c/2;
        if(h<1){r=c;g=x;b=0;}else if(h<2){r=x;g=c;b=0;}else if(h<3){r=0;g=c;b=x;}else if(h<4){r=0;g=x;b=c;}else if(h<5){r=x;g=0;b=c;}else{r=c;g=0;b=x;}
        r+=base;g+=base;b+=base;
      }
    }
    y=.2126*r+.7152*g+.0722*b;
    const sat=recipe.saturation+recipe.vibrance*(1-(Math.max(r,g,b)-Math.min(r,g,b)));
    r=y+(r-y)*sat;g=y+(g-y)*sat;b=y+(b-y)*sat;
    const sw=(1-y)**2,mw=2*y*(1-y),hw=y*y;
    r=r*(1-recipe.fade)+recipe.fade+recipe.shadow_tint[0]*sw+mt[0]*mw+recipe.highlight_tint[0]*hw;
    g=g*(1-recipe.fade)+recipe.fade+recipe.shadow_tint[1]*sw+mt[1]*mw+recipe.highlight_tint[1]*hw;
    b=b*(1-recipe.fade)+recipe.fade+recipe.shadow_tint[2]*sw+mt[2]*mw+recipe.highlight_tint[2]*hw;
    y=.2126*r+.7152*g+.0722*b;target=clamp(y);peak=Math.max(r,g,b);low=Math.min(r,g,b);scale=1;
    if(peak>1&&peak>y)scale=Math.min(scale,(1-target)/(peak-y));
    if(low<0&&y>low)scale=Math.min(scale,target/(y-low));
    r=clamp(target+(r-y)*scale);g=clamp(target+(g-y)*scale);b=clamp(target+(b-y)*scale);
    out[i]=src[i]+(r*255-src[i])*strength;out[i+1]=src[i+1]+(g*255-src[i+1])*strength;out[i+2]=src[i+2]+(b*255-src[i+2])*strength;out[i+3]=src[i+3];
  }
  return out;
}
// Strength scales parameters around neutral. The final pixels are never extrapolated beyond 100%.
function recipeAtStrength(recipe,toneAmount,colorAmount){
  const n=neutral(),r=structuredClone(recipe),toneKeys=['exposure','contrast','gamma','shadows','highlights','fade'];
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  for(const [key,[a,b]] of Object.entries(ranges)){const amount=toneKeys.includes(key)?toneAmount:colorAmount;r[key]=clamp(n[key]+(recipe[key]-n[key])*amount,a,b);}
  for(const key of ['shadow_tint','midtone_tint','highlight_tint'])r[key]=recipe[key].map(v=>clamp(v*colorAmount,-.18,.18));
  r.hsl=recipe.hsl.map(row=>[clamp(row[0]*colorAmount,-45,45),clamp(1+(row[1]-1)*colorAmount,0,2),clamp(row[2]*colorAmount,-.25,.25)]);
  r.tone_curve=recipe.tone_curve.map((v,i)=>clamp(i/4+(v-i/4)*toneAmount,0,1));
  // Keep amplified curves monotonic and leave room for every following point.
  for(let i=0;i<5;i++)r.tone_curve[i]=clamp(r.tone_curve[i],i===0?0:r.tone_curve[i-1]+.02,1-(4-i)*.02);
  return r;
}
function currentRecipe(){return recipeAtStrength(state.result.plan.recipe,+$('toneStrength').value/100,+$('colorStrength').value/100);}


window.portfolioEngine={neutral,recipeAtStrength,renderPixels};
})();

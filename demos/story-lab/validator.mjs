// New public reference validator for the exported structural contract.
export function validateSchema(value,schema,path='$',issues=[]){
  const type=schema.type;const valid=type==='array'?Array.isArray(value):type==='object'?value!==null&&typeof value==='object'&&!Array.isArray(value):type==='integer'?Number.isInteger(value):typeof value===type;
  if(type&&!valid){issues.push({path,code:'TYPE',message:'类型应为 '+type});return issues;}
  if(schema.enum&&!schema.enum.includes(value))issues.push({path,code:'ENUM',message:'不在允许词表中'});
  if(type==='string'){if(schema.minLength&&value.trim().length<schema.minLength)issues.push({path,code:'EMPTY',message:'不能为空'});if(schema.maxLength&&value.length>schema.maxLength)issues.push({path,code:'TOO_LONG',message:'超过字数上限'});}
  if(type==='object'){for(const key of schema.required||[])if(!(key in value))issues.push({path:path+'.'+key,code:'REQUIRED',message:'缺少必填字段'});for(const [key,s]of Object.entries(schema.properties||{}))if(key in value)validateSchema(value[key],s,path+'.'+key,issues);}
  if(type==='array'){if(schema.minItems&&value.length<schema.minItems)issues.push({path,code:'MIN_ITEMS',message:'条数少于 '+schema.minItems});if(schema.maxItems&&value.length>schema.maxItems)issues.push({path,code:'MAX_ITEMS',message:'条数超过 '+schema.maxItems});if(schema.items)value.forEach((item,i)=>validateSchema(item,schema.items,path+'['+i+']',issues));}
  return issues;
}
export function validateRecord(record,source,schema){
  const issues=validateSchema(record,schema);const beats=Array.isArray(record?.情节链)?record.情节链:[];const hookTypes=['反转类','打脸类','身份揭露类','信息揭露类','情绪类','危机类','误会类','决裂类','悬念类','当众羞辱类'];let hooks=0;
  beats.forEach((b,i)=>{if(b?.序!==i+1)issues.push({path:'$.情节链['+i+'].序',code:'ORDER',message:'序号应为 '+(i+1)});if(b?.节拍类型==='卡点'){hooks++;if(!hookTypes.includes(b.卡点类型))issues.push({path:'$.情节链['+i+'].卡点类型',code:'HOOK_TYPE',message:'卡点类型不在词表中'});}});
  if(hooks<4)issues.push({path:'$.情节链',code:'HOOK_COUNT',message:'至少需要 4 个候选卡点'});
  const quotes=[['简介钩子',record?.简介钩子,40],['核心伤害.原文证据',record?.核心伤害?.原文证据,50],['开局卡点.原文钩子句',record?.开局卡点?.原文钩子句,40],['结局.结尾最后一句',record?.结局?.结尾最后一句,50],...beats.map((b,i)=>['情节链['+i+'].原文关键句',b?.原文关键句,40])];
  const evidence=quotes.map(([path,quote,limit])=>{const offset=typeof quote==='string'&&quote?source.indexOf(quote):-1;if(offset<0)issues.push({path:'$.'+path,code:'QUOTE_MISS',message:'摘录未逐字命中原文'});if(typeof quote==='string'&&quote.length>limit)issues.push({path:'$.'+path,code:'QUOTE_LENGTH',message:'摘录超过 '+limit+' 字'});return{path,matched:offset>=0,start_line:offset>=0?source.slice(0,offset).split('\n').length:null};});
  return{passed:issues.length===0,issues,evidence,note:'仅执行公开核心契约与逐字摘录检查；不判定语义正确、编辑质量或真实付费位置。与私有原校验器的归一化、清洗等行为并不完全等价。'};
}

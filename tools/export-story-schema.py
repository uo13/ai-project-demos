"""Export the existing record contract, without exporting any story text."""
import argparse,ast,json
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--pipeline-root',type=Path,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args()
tree=ast.parse((a.pipeline_root/'resume_validate.py').read_text(encoding='utf-8-sig'));nodes={n.targets[0].id:n.value for n in tree.body if isinstance(n,ast.Assign) and isinstance(n.targets[0],ast.Name)}
def fields(name):
    n=nodes[name];return{ast.literal_eval(k):{'type':{'str':'string','int':'integer','list':'array'}[v.id],**({'minLength':1} if v.id=='str' else {})} for k,v in zip(n.keys,n.values)}
def obj(props):return{'type':'object','required':list(props),'properties':props}
props=fields('TOP');props['超短简介']['maxLength']=60
for key,value in zip(nodes['REQUIRED'].keys,nodes['REQUIRED'].values):
    props[ast.literal_eval(key)]=obj({ast.literal_eval(k):{'type':{'str':'string','int':'integer','list':'array'}[v.id],**({'minLength':1} if v.id=='str' else {})} for k,v in zip(value.keys,value.values)})
props['开局卡点']['properties']['钩子类型']['enum']=['身份错位','隐藏身份','误会','当众羞辱','生死危机','重生先知','物质落差','异常规则']
beat=fields('BEAT');beat['卡点类型']={'type':'string'};beat['节拍类型']['enum']=['受损','反击','卡点'];props['情节链'].update(minItems=8,maxItems=14,items=obj(beat))
changes=fields('CHANGE');changes['变化类型']['enum']=['关系变化','认知变化','地位变化','力量变化','信息变化','资源变化'];props['情节变化'].update(minItems=4,maxItems=8,items=obj(changes))
props['对手弧线']['items']=obj({key:{'type':'string','minLength':1} for key in ['角色','动机','手段','弱点','结局']})
schema={'$schema':'https://json-schema.org/draft/2020-12/schema','title':'Story factor record: exported core contract','description':'Core structural constraints from the existing validator. Portfolio validator additionally checks beat order, hook count and literal evidence. Not a complete replacement for editorial review.',**obj(props)}
a.output.write_text(json.dumps(schema,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print('Exported core schema')

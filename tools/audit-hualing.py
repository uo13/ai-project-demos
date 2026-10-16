"""Audit existing private Hualing source with synthetic model/tool boundaries.

Usage: python tools/audit-hualing.py --source-root PATH --output data/hualing-audit.json
Requires aiohttp and pydantic. The source is executed in-process; use trusted code only.
No original source, database, credentials or private user inputs are copied to the report.
"""
from __future__ import annotations
import argparse,ast,asyncio,hashlib,json,logging,types,sys
from pathlib import Path

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--source-root',type=Path,required=True);parser.add_argument('--output',type=Path,required=True);parser.add_argument('--candidate-guard',action='store_true');args=parser.parse_args()
    backend=args.source_root/'hualing-backend';path=backend/'app/services/agent_service.py';source=path.read_text(encoding='utf-8-sig');tree=ast.parse(source)
    module=types.ModuleType('portfolio_hualing_audit');sys.modules[module.__name__]=module;ns=module.__dict__
    base_path=backend/'app/tools/base.py';exec(compile(base_path.read_text(encoding='utf-8-sig'),str(base_path),'exec'),ns)
    settings=types.SimpleNamespace(ai_api_key='fixture-only',ai_base_url='https://invalid.example',default_ai_model='fixture-model',ai_max_retries=1,ai_retry_delay=0)
    class Registry:
        def get_openai_tools(self,tier):return [{'type':'function','function':{'name':'fixture_tool','parameters':{'type':'object'}}}]
    ns.update(get_settings=lambda:settings,get_tool_registry=lambda:Registry(),translate_tool_name=lambda name,lang:name,log_tool_call_start=lambda **kw:None,log_tool_call_result=lambda **kw:None,log_tool_call_exception=lambda **kw:None,create_aiohttp_connector=lambda:None)
    tree.body=[n for n in tree.body if not(isinstance(n,ast.ImportFrom) and (n.module or '').startswith('app.'))]
    exec(compile(tree,str(path),'exec'),ns);ns['logger'].disabled=True
    Agent=ns['AgentService'];Context=ns['ExecutionContext'];Result=ns['ToolResult'];cases=[]
    if args.candidate_guard:
        from hualing_profile_guard import guard_profile_arguments
        original_normalizer=Agent._normalize_tool_arguments
        def guarded(self,**kw):
            result=original_normalizer(self,**kw)
            return guard_profile_arguments(kw['tool_name'],result,kw['context'].selected_profiles,kw['arguments'])
        Agent._normalize_tool_arguments=guarded
    def record(ident,title,expected,observed,passed,events=None):
        print(ident, 'pass' if passed else 'gap', flush=True)
        cases.append(dict(id=ident,title=title,expected=expected,observed=observed,passed=bool(passed),events=events or []))
    def response(content='',calls=None,finish='stop',ok=True,reason=None):
        msg={'role':'assistant','content':content};calls=calls or []
        if calls:msg['tool_calls']=calls
        return dict(ok=ok,content=content,tool_calls=calls,assistant_message=msg,finish_reason=finish,interrupted=False,stop_reason=reason)
    def call(name,ident='tool-1',arguments=None):return {'id':ident,'type':'function','function':{'name':name,'arguments':json.dumps(arguments or {})}}
    async def run_case(responses,*,key=True,tool=None,continuations=None,max_rounds=3,max_continuations=1):
        settings.ai_api_key='fixture-only' if key else '';service=Agent();service.max_rounds=max_rounds;service.max_continuations=max_continuations;events=[];invocations=[]
        async def model(**kw):return responses.pop(0)
        async def continuation(**kw):return (continuations or [response('')]).pop(0)
        async def execute(name,arguments,context):
            invocations.append({'tool':name,'arguments':dict(arguments)})
            if tool:return tool(name,arguments,context)
            return Result(success=True,summary='合成工具结果',data={'fixture':True},display_type='card',display_data={'fixture':True})
        ns['execute_tool']=execute;service._stream_model_round=model;service._stream_continuation=continuation
        result=await service.run(messages=[{'role':'user','content':'查询 2026-10-17 的演示信息'}],context=Context(user_id='synthetic-user',trace_id='synthetic-trace',subscription_tier='basic'),event_callback=lambda e:events.append(e['type']))
        return result,events,invocations
    async def exercise():
        r,e,inv=await run_case([],key=False);record('H01','未配置服务时明确失败','missing_api_key',r.stop_reason,r.stop_reason=='missing_api_key')
        r,e,inv=await run_case([response(calls=[call('bazi_chart','t1'),call('five_elements','t2')]),response('合成回答')]);record('H02','多工具执行后回传结果并结束',{'tools':2,'rounds':2,'stop':'completed'},{'tools':len(r.tool_calls),'rounds':r.rounds_used,'stop':r.stop_reason,'execution_trace':r.execution_trace},len(inv)==2 and r.stop_reason=='completed' and r.rounds_used==2,e)
        def date_tool(name,a,c):return Result(success=True,summary='日期已解析') if a.get('date') else Result(success=False,error_code='INVALID_PARAMS',error_message='missing date',user_message='缺少日期')
        r,e,inv=await run_case([response(calls=[call('almanac_query')]),response('合成日期结果')],tool=date_tool);record('H03','工具缺参后从用户消息修复并限次重试',{'attempts':2,'date':'2026-10-17'},{'attempts':len(inv),'arguments':[i['arguments'] for i in inv],'stop':r.stop_reason},len(inv)==2 and inv[-1]['arguments'].get('date')=='2026-10-17',e)
        r,e,inv=await run_case([response('合成上游失败',ok=False,reason='provider_error')]);record('H04','上游错误不冒充成功','provider_error',r.stop_reason,r.stop_reason=='provider_error')
        r,e,inv=await run_case([response(calls=[call('fixture_tool')]) for _ in range(2)],max_rounds=2);record('H05','工具循环受到轮数限制','max_rounds_exceeded',r.stop_reason,r.stop_reason=='max_rounds_exceeded' and len(inv)==2,e)
        r,e,inv=await run_case([response('片段一',finish='length')],continuations=[response('片段二',finish='length')]);record('H06','续写预算耗尽后保留截断状态','length_exceeded',r.stop_reason,r.stop_reason=='length_exceeded')
        r,e,inv=await run_case([response('')],continuations=[response('')]);record('H07','空回答重试仍为空时明确失败','empty_response',r.stop_reason,r.stop_reason=='empty_response')
    asyncio.run(exercise());settings.ai_api_key='fixture-only';service=Agent()
    old={'year':1990,'month':1,'day':1};first={'year':2000,'month':2,'day':2};second={'year':2001,'month':3,'day':3}
    context=Context(user_id='synthetic-user',user_profile={'birth_info':old},selected_profiles=[{'record_id':'selected-a','birth_info':first}]);out=service._normalize_tool_arguments(tool_name='bazi_chart',arguments={'record_id':'unselected','birth_info':old},context=context,user_messages=[]);record('H08','显式档案覆盖模型提供的未选中 ID','selected-a',{'record_id':out.get('record_id'),'birth_info_present':'birth_info' in out},out.get('record_id')=='selected-a' and 'birth_info' not in out)
    out=service._normalize_assistant_message({'role':'assistant','content':'合成正文','reasoning_content':'fixture-private-reasoning'});record('H09','原始 reasoning_content 不进入规范化消息',False,'reasoning_content' in out,'reasoning_content' not in out)
    splitter=ns['_SSELineSplitter']();raw='data: {"text":"中文分片"}\n'.encode();out=[]
    for byte in raw:out.extend(splitter.feed(bytes([byte])))
    out.extend(splitter.flush());record('H10','SSE 单字节切片不破坏中文 UTF-8',True,out==[raw.decode().strip('\n')],out==[raw.decode().strip('\n')])
    context=Context(user_id='synthetic-user',user_profile={'birth_info':old},selected_profiles=[{'record_id':'selected-a','birth_info':first},{'record_id':'selected-b','birth_info':second}]);out=service._normalize_tool_arguments(tool_name='five_elements',arguments={'record_id':'selected-b'},context=context,user_messages=[]);record('H11','第二个选中档案的 ID 与出生信息保持一致',{'record_id':'selected-b','birth_info':second},out,out.get('record_id')=='selected-b' and out.get('birth_info')==second)
    context=Context(user_id='synthetic-user',user_profile={'birth_info':old});out=service._normalize_tool_arguments(tool_name='ziwei_chart',arguments={'record_id':'record-only'},context=context,user_messages=[]);record('H12','仅以档案 ID 查询时不重新注入旧出生信息',{'record_id':'record-only','birth_info_present':False},out,'birth_info' not in out)
    report={'audit_date':'2026-10-17','variant':'candidate_boundary_guard' if args.candidate_guard else 'original_snapshot','method':'Execute original production AgentService and tool base after replacing application import boundaries; model rounds and tool executors are synthetic fixtures; no network or database. Optional candidate guard wraps argument normalization only.','source_files':[{'path':'hualing-backend/app/services/agent_service.py','sha256':hashlib.sha256(path.read_bytes()).hexdigest()},{'path':'hualing-backend/app/tools/base.py','sha256':hashlib.sha256(base_path.read_bytes()).hexdigest()}],'summary':{'total':len(cases),'passed':sum(c['passed'] for c in cases),'failed':sum(not c['passed'] for c in cases)},'cases':cases,'limits':['Not a live provider integration test.','Not an ownership attestation for individual contributions.','Production source unchanged; candidate guard is not deployed.','Database access and executor ownership validation outside this audit.','run() execution_trace is None in this snapshot; emitted tool events are tested instead.']}
    args.output.parent.mkdir(parents=True,exist_ok=True);args.output.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps(report['summary']))

if __name__=='__main__':main()

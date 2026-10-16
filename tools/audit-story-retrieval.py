"""Re-run the historical keyword conditions against private records; no titles/text exported."""
import argparse,json,hashlib
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--batch',type=Path,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args()
path=a.batch/'records.json';records=json.loads(path.read_text(encoding='utf-8-sig'));fields=['超短简介','身份锚点','核心伤害','开局卡点','主角弧线','可复用装置','结局']
def searchable(r):return json.dumps({k:r[k] for k in fields},ensure_ascii=False)
queries=[
 {'id':'Q1','purpose':'公开核验','groups':[['直播','当众','公开'],['票根','凭证','证据','发票']]},
 {'id':'Q1-refined','purpose':'公开核验，增加具体资格物件','groups':[['直播','当众','公开'],['票根','凭证','证据','发票'],['票根','入场','通行证','门票']]},
 {'id':'Q2','purpose':'清算退出','groups':[['清算','索赔','讨回','赔偿'],['离婚','退婚','离家','分手']]},
 {'id':'Q3','purpose':'职业重建','groups':[['科研','研究','专业','教学'],['离开','辞职','离婚','新生']]}
]
for q in queries:
    ids=[f'REC-{r["_id"]:04d}' for r in records if all(any(w in searchable(r) for w in group) for group in q['groups'])];q.update(candidate_count=len(ids),candidate_ids=ids)
out={'audit_date':'2026-10-17','records':len(records),'record_file_sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'method':'OR within each group, AND across groups, literal keyword matching in the same 7 historical analysis fields.','queries':queries,'limits':['Candidate count is not relevance precision.','No held-out gold labels or blind retrieval test.','Q1-refined is post-hoc query refinement, not a model improvement.']};a.output.write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps({q['id']:q['candidate_count'] for q in queries}))

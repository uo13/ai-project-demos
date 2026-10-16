"""Read-only re-audit of a frozen private story batch; publish hashes/counts only.

Usage: python tools/audit-story-batch.py --pipeline-root PATH --output data/story-audit.json
Uses schema()/audit() from the trusted existing validator, without invoking its main().
"""
from __future__ import annotations
import argparse,ast,hashlib,json
from pathlib import Path

def main():
    p=argparse.ArgumentParser();p.add_argument('--pipeline-root',type=Path,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args()
    base=a.pipeline_root;batch=base/'outputs/sample_test_20261016';records_path=batch/'records.json';manifest_path=batch/'manifest.json';validator=base/'resume_validate.py'
    tree=ast.parse(validator.read_text(encoding='utf-8-sig'));keep=[]
    for n in tree.body:
        if isinstance(n,(ast.Import,ast.ImportFrom,ast.FunctionDef)):keep.append(n)
        elif isinstance(n,ast.Assign) and all(isinstance(t,ast.Name) and t.id in {'CARD','ALIASES','REQUIRED','TOP','BEAT','CHANGE'} for t in n.targets):keep.append(n)
    ns={'__name__':'portfolio_story_audit','__file__':str(validator)};exec(compile(ast.Module(body=keep,type_ignores=[]),str(validator),'exec'),ns)
    records=json.loads(records_path.read_text(encoding='utf-8-sig'));manifest=json.loads(manifest_path.read_text(encoding='utf-8-sig'));byid={m['id']:m for m in manifest};rows=[]
    for record in records:
        ident=record['_id'];m=byid[ident];path=Path(m['source']);raw=path.read_bytes();src=path.read_text(encoding='utf-8-sig');actual_hash=hashlib.sha256(src.encode('utf-8')).hexdigest();out=ns['audit'](record,m);lines=src.splitlines();line_errors=0
        for item in out['_evidence']:
            if item['match']!='exact':continue
            start=item['start_line'];end=item['end_line'];span='\n'.join(lines[start-1:end])
            if item['quote'].replace('\r\n','\n') not in span:line_errors+=1
        rows.append({'id':f'REC-{ident:04d}','source_text_sha256':actual_hash,'source_bytes_sha256':hashlib.sha256(raw).hexdigest(),'manifest_hash_matches':actual_hash==m['source_sha256'],'record_sha256':hashlib.sha256(json.dumps(record,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'schema_issues':len(ns['schema'](out)),'quote_exact':out['_quote_ok'],'quote_unmatched':out['_quote_miss'],'line_mapping_issues':line_errors,'normalizations_this_run':len(out['_normalizations']),'source_note_count':len(out['_source_issues']),'beats':len(out.get('情节链') or []),'supplemental_beats':len(out.get('_supplemental_beats') or []),'changes':len(out.get('情节变化') or []),'devices':len(out.get('可复用装置') or [])})
    summary={'records':len(rows),'manifest_records':len(manifest),'hash_matches':sum(r['manifest_hash_matches'] for r in rows),'schema_issues':sum(r['schema_issues'] for r in rows),'quote_exact':sum(r['quote_exact'] for r in rows),'quote_unmatched':sum(r['quote_unmatched'] for r in rows),'line_mapping_issues':sum(r['line_mapping_issues'] for r in rows),'normalizations_this_run':sum(r['normalizations_this_run'] for r in rows),'beats':sum(r['beats'] for r in rows),'supplemental_beats':sum(r['supplemental_beats'] for r in rows),'changes':sum(r['changes'] for r in rows),'devices':sum(r['devices'] for r in rows),'stories_with_source_notes':sum(r['source_note_count']>0 for r in rows)}
    report={'audit_date':'2026-10-17','method':'Read-only execution of existing schema and audit functions against the frozen 185-record batch and original source text; hashes and numeric results only.','hash_contract':'Manifest SHA-256 uses UTF-8 text after BOM removal and universal newline normalization; raw-byte SHA-256 is separately retained.','artifacts':[{'name':name,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()} for name,path in [('validator',validator),('frozen_records',records_path),('frozen_manifest',manifest_path)]],'summary':summary,'records':rows,'limits':['No model re-extraction performed.','Exact quote and line checks do not validate interpretive semantics.','Hashes establish file identity, not authorship or public reproducibility without private sources.','No original story text, titles, source URLs or local paths published.']}
    a.output.parent.mkdir(parents=True,exist_ok=True);a.output.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps(summary))

if __name__=='__main__':main()

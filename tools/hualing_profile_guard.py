"""Candidate boundary guard, newly written for the portfolio.

This is an isolated reference adapter, NOT a patch deployed to Hualing.
It does not replace database ownership validation or refresh stale profile versions.
"""
from copy import deepcopy

RECORD_TOOLS={'bazi_chart','ziwei_chart','dayun_query','five_elements','yearly_forecast','shensha_query','dharma_recommendation'}
BIRTH_TOOLS={'five_elements','dayun_query','yearly_forecast','shensha_query','dharma_recommendation','ziwei_chart'}

def guard_profile_arguments(tool_name,normalized,selected_profiles,requested=None):
    result=deepcopy(normalized);selected=selected_profiles or [];requested=requested or {}
    if selected and tool_name in RECORD_TOOLS:
        byid={p['record_id']:p for p in selected}
        if len(selected)>1 and requested.get('record_id') not in byid:
            raise ValueError('Choose one explicit profile before execution')
        chosen=byid.get(result.get('record_id'))
        if chosen is None:raise ValueError('Resolved profile is outside explicit selection')
        if tool_name in BIRTH_TOOLS and tool_name!='ziwei_chart':
            if not chosen.get('birth_info'):raise ValueError('Selected profile requires authoritative hydration')
            result['birth_info']=deepcopy(chosen['birth_info'])
    if tool_name=='ziwei_chart' and result.get('record_id'):
        result.pop('birth_info',None)
    return result

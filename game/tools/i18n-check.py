#!/usr/bin/env python3
"""python3 game/tools/i18n-check.py <source_ja.json> <translations.json>

Checks a translation file against its source list:
- every id has "en" and "zh", both non-empty
- each translation has exactly as many {} slots as the Japanese (numbers and names are filled in, in the same order)
- line breaks (\\n) are kept
- no Japanese kana left in English or Chinese
Prints problems and exits with 1 when there are any.
"""
import json, re, sys
src = json.load(open(sys.argv[1], encoding='utf-8'))
tr = json.load(open(sys.argv[2], encoding='utf-8'))
KANA = re.compile(r'[぀-ヿ]')
bad = 0
for k, v in src.items():
    ja = v['ja']; t = tr.get(k)
    if not t: print(k, 'missing'); bad += 1; continue
    for lang in ('en', 'zh'):
        s = t.get(lang)
        if not isinstance(s, str) or not s.strip(): print(k, lang, 'empty'); bad += 1; continue
        if s.count('{}') != ja.count('{}'): print(k, lang, f'{{}} count {s.count("{}")} != {ja.count("{}")}', '|', ja, '|', s); bad += 1
        if ja.count('\n') != s.count('\n'): print(k, lang, 'line breaks differ', '|', repr(ja), '|', repr(s)); bad += 1
        if KANA.search(s): print(k, lang, 'kana left', '|', s); bad += 1
extra = set(tr) - set(src)
if extra: print('ids not in the source:', sorted(extra)[:10]); bad += 1
print('OK' if not bad else f'{bad} problems', f'({len(src)} strings)')
sys.exit(1 if bad else 0)

#!/usr/bin/env python3
"""python3 game/tools/i18n-build.py

Puts the translations into the game:
  team/04_翻訳/strings_ja.json      the Japanese source list (id → ja)
  team/04_翻訳/translations.json    id → {en, zh}   (made by merging team/04_翻訳/work/chunk*_out.json when present)
  team/04_翻訳/overrides.json       ja → {en, zh}   for text outside the game's code (page title …) or hand fixes
and writes LANG_PACK = {en: {ja: en}, zh: {ja: zh}} between /*I18N-START*/ and /*I18N-END*/ in game/houkago-deadline.html.
Translations whose {} count does not match the Japanese are left out (the Japanese is shown instead) and listed.
"""
import json, glob, os, re, sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
TDIR = os.path.join(ROOT, 'team', '04_翻訳')
GAME = os.path.join(ROOT, 'game', 'houkago-deadline.html')

src = json.load(open(os.path.join(TDIR, 'strings_ja.json'), encoding='utf-8'))
tpath = os.path.join(TDIR, 'translations.json')
tr = json.load(open(tpath, encoding='utf-8')) if os.path.exists(tpath) else {}
for f in sorted(glob.glob(os.path.join(TDIR, 'work', 'chunk*_out.json'))):   # newest work wins
    tr.update(json.load(open(f, encoding='utf-8')))
tr = {k: v for k, v in tr.items() if k in src}
json.dump(dict(sorted(tr.items())), open(tpath, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

pack = {'en': {}, 'zh': {}}
skipped = []
for k, v in src.items():
    t = tr.get(k)
    if not t: continue
    ja = v['ja']
    for lang in ('en', 'zh'):
        s = t.get(lang)
        if not s: continue
        if s.count('{}') != ja.count('{}'): skipped.append((k, lang)); continue
        pack[lang][ja] = s
opath = os.path.join(TDIR, 'overrides.json')
if os.path.exists(opath):
    for ja, t in json.load(open(opath, encoding='utf-8')).items():
        if ja.startswith('_'): continue
        for lang in ('en', 'zh'):
            if t.get(lang) is not None: pack[lang][ja] = t[lang]

html = open(GAME, encoding='utf-8').read()
blob = '/*I18N-START*/const LANG_PACK = ' + json.dumps(pack, ensure_ascii=False, separators=(',', ':')) + ';/*I18N-END*/'
new, n = re.subn(r'/\*I18N-START\*/.*?/\*I18N-END\*/', lambda m: blob, html, count=1, flags=re.S)
if n != 1: sys.exit('I18N markers not found in the game file')
open(GAME, 'w', encoding='utf-8').write(new)
done = sum(1 for k in src if k in tr)
print(f'{done}/{len(src)} strings translated · en {len(pack["en"])} · zh {len(pack["zh"])} entries · pack {len(blob) // 1024} KB')
if skipped: print('left out ({} count differs):', skipped[:20])

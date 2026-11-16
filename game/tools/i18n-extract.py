#!/usr/bin/env python3
"""python3 game/tools/i18n-extract.py game/houkago-deadline.html team/04_翻訳/strings_ja.json

Collects every piece of Japanese text in the game into a numbered list for the translators.
- quoted strings ('...' and "..."): the text itself (escapes such as \\n decoded)
- template strings (`...`): each run of text between HTML tags, with every ${...} written as {}
- strings that contain HTML tags are split at the tags the same way
- every number is written as {} too, because the game fills numbers in at run time
Existing ids are kept when the file already exists, so translations already made stay attached to their text.
"""
import json, re, sys, os

JP = re.compile(r'[぀-ヿ㐀-鿿]')
html_path, out_path = sys.argv[1], sys.argv[2]
src = open(html_path, encoding='utf-8').read()
code = src[src.index('<script>'):]
code = re.sub(r'data:image/png;base64,[A-Za-z0-9+/=]+', '', code)
code = re.sub(r'/\*I18N-START\*/.*?/\*I18N-END\*/', '', code, flags=re.S)   # never re-extract the translations themselves

# each section starts at its definition (first match of the pattern)
SECTIONS = [(r'const CHARS =', 'キャラクター'), (r'const PERKS', 'スキル'), (r'const WBASE', '武器'), (r'const VARIANTS', '武器の種類'), (r'const ATTS', '武器パーツ'),
            (r'const PAINTS', '武器の塗装'), (r'const ARMOR =', '防具'), (r'const ENEMIES', '敵'), (r'const BOSSES', 'ボス'), (r'const CHAPTERS', '章'),
            (r'const STAGES', 'ステージ'), (r'const STORY', 'ストーリーのセリフ'), (r'function totalKills', '実績'), (r'const TIPS', 'ヒント'),
            (r'const SAVE_KEY', 'セーブ・共通'), (r'const GFX = ', '背景の看板'), (r'const SND = ', '効果音'), (r'function charStats', 'ゲームの仕組み'),
            (r'function battleStart', '戦闘画面'), (r'const KEY_DEF', 'キー設定'), (r'function snipeStart', '狙撃ステージ'), (r'const UI = ', 'メニュー画面'),
            (r'const PAD = ', 'ゲームパッド'), (r'function boot', '起動')]
marks = []
for pat, label in SECTIONS:
    m = re.search(pat, code)
    if m: marks.append((m.start(), label))
marks.sort()
def section(pos):
    lab = 'その他'
    for p, l in marks:
        if p > pos: break
        lab = l
    return lab

def decode(s):
    return re.sub(r"\\(.)", lambda m: {'n': '\n', 't': '\t'}.get(m.group(1), m.group(1)), s)

def norm(t):
    t = re.sub(r'\d+(?:\.\d+)?', '{}', t)
    return re.sub(r'(\{\})+', '{}', t) if False else t

def runs(text):
    """split a string at HTML tags; keep runs with Japanese, trimmed"""
    out = []
    for part in re.split(r'<[^<>]*>', text):
        part = part.strip()
        if JP.search(part): out.append(part)
    return out

def template_runs(body):
    """replace ${...} (balanced) by {} and return the text runs"""
    res, i, depth = [], 0, 0
    buf = ''
    while i < len(body):
        if body.startswith('${', i):
            j, d = i + 2, 1
            while j < len(body) and d:
                if body[j] == '{': d += 1
                elif body[j] == '}': d -= 1
                elif body[j] == '`':   # skip nested template
                    k = j + 1
                    while k < len(body) and body[k] != '`': k += 2 if body[k] == '\\' else 1
                    j = k
                elif body[j] in "'\"":
                    q, k = body[j], j + 1
                    while k < len(body) and body[k] != q: k += 2 if body[k] == '\\' else 1
                    j = k
                j += 1
            buf += '{}'; i = j
        else:
            buf += body[i]; i += 1
    return runs(decode(buf))

found = {}   # key -> section
def add(t, pos):
    t = norm(t)
    if JP.search(t) and t not in found: found[t] = section(pos)

# walk the code with a small recursive tokenizer: strings, templates and ${...} nested to any depth
import sys as _sys
_sys.setrecursionlimit(10000)
n = len(code)
def read_quoted(i):
    q, j = code[i], i + 1
    while j < n and code[j] != q and code[j] != '\n': j += 2 if code[j] == '\\' else 1
    lit = code[i + 1:j]
    if JP.search(lit):
        if re.search(r'<[a-z/]', lit): [add(r, i) for r in runs(decode(lit))]
        else: add(decode(lit).strip(), i)
    return j + 1
def scan_code(i, in_expr=False):
    depth = 0
    while i < n:
        c = code[i]
        if not in_expr and code.startswith('//', i) and (i == 0 or code[i - 1] != ':'):
            j = code.find('\n', i); i = n if j < 0 else j; continue
        if code.startswith('/*', i):
            j = code.find('*/', i + 2); i = n if j < 0 else j + 2; continue
        if c in "'\"": i = read_quoted(i); continue
        if c == '`': i = scan_tpl(i + 1); continue
        if c == '{': depth += 1
        elif c == '}':
            if in_expr and depth == 0: return i
            depth -= 1
        i += 1
    return i
def scan_tpl(i):
    start, buf = i, ''
    while i < n:
        c = code[i]
        if c == '\\': buf += code[i:i + 2]; i += 2; continue
        if code.startswith('${', i):
            buf += '{}'; i = scan_code(i + 2, True) + 1; continue
        if c == '`':
            for r in runs(decode(buf)): add(r, start)
            return i + 1
        buf += c; i += 1
    return i
scan_code(0)

# keep ids stable across runs
old = {}
if os.path.exists(out_path):
    for k, v in json.load(open(out_path, encoding='utf-8')).items(): old[v['ja']] = k
nxt = max([int(k[1:]) for k in old.values()] + [0]) + 1
out = {}
for t, sec in found.items():
    if t in old: k = old[t]
    else: k = 's%04d' % nxt; nxt += 1
    out[k] = {'ja': t, 'where': sec}
out = dict(sorted(out.items()))
json.dump(out, open(out_path, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
from collections import Counter
print(len(out), 'strings', dict(Counter(v['where'] for v in out.values())))

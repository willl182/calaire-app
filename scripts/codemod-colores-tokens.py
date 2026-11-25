"""Reemplaza clases de color Tailwind fijas por tokens semánticos."""
import re, sys, glob

FAM = {
    'emerald': 'success', 'green': 'success', 'teal': 'success', 'lime': 'success',
    'amber': 'warning', 'yellow': 'warning', 'orange': 'warning',
    'rose': 'danger', 'red': 'danger', 'pink': 'danger',
    'sky': 'info', 'blue': 'info', 'cyan': 'info', 'indigo': 'info',
    'violet': 'special', 'purple': 'special', 'fuchsia': 'special',
    'slate': 'N', 'gray': 'N', 'zinc': 'N', 'neutral': 'N', 'stone': 'N',
}
PAT = re.compile(r'(?<![\w-])((?:[a-z0-9-]+:)*)(bg|text|border|ring|from|to|via|divide|outline|fill|stroke|accent|placeholder|decoration)-(' + '|'.join(FAM) + r')-(\d+)(/\d+)?(?![\w-])')

def sem(prefix, t, n, hover):
    if prefix in ('bg', 'from', 'to', 'via'):
        if n <= 50: return f'{t}-soft'
        if n <= 100: return f'{t}-border/50' if hover else f'{t}-soft'
        if n <= 300: return f'{t}-border'
        if n <= 500: return t
        return f'{t}-strong'
    if prefix in ('text', 'fill', 'stroke', 'decoration', 'placeholder'):
        if n <= 200: return f'{t}-soft'
        if n <= 400: return t
        return f'{t}-strong'
    # border, ring, divide, outline, accent
    if n <= 300: return f'{t}-border'
    if n <= 500: return t
    return f'{t}-strong'

def neutral(prefix, n, hover):
    if prefix in ('bg', 'from', 'to', 'via'):
        if n <= 50: return 'surface'
        if n <= 100: return 'line-soft' if hover else 'surface-muted'
        if n <= 200: return 'line-soft'
        if n <= 300: return 'line'
        if n <= 500: return 'line-strong'
        return 'foreground'
    if prefix in ('text', 'fill', 'stroke', 'decoration', 'placeholder'):
        if n <= 200: return 'line-soft'
        if n <= 600: return 'muted'
        return 'foreground'
    if n <= 200: return 'line-soft'
    if n <= 300: return 'line'
    return 'line-strong'

def convert(s):
    def rep(m):
        variants, prefix, fam, n, op = m.group(1), m.group(2), m.group(3), int(m.group(4)), m.group(5) or ''
        hover = 'hover:' in variants
        t = FAM[fam]
        val = neutral(prefix, n, hover) if t == 'N' else sem(prefix, t, n, hover)
        if '/' in val and op:
            val = val.split('/')[0]
        return f'{variants}{prefix}-{val}{op}'
    return PAT.sub(rep, s)

if __name__ == '__main__':
    for p in sys.argv[1:]:
        s = open(p).read()
        s2 = convert(s)
        if s2 != s:
            open(p, 'w').write(s2)

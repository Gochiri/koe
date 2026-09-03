import os, re, html
import markdown

BASE = os.path.dirname(os.path.abspath(__file__))
FINAL = os.path.join(BASE, 'final')
SRC = os.path.join(BASE, 'src')

PIECES = [
    ('hoja',        '00', 'Hoja de números',                        'Manda sobre todo lo demás. Si otra pieza dice otra cosa, la pieza está mal.', os.path.join(BASE, 'hoja-numeros.md'), None),
    ('canales',     '01', 'De dónde salen 5 contactos por día',      'El domingo: la lista tibia. Cada mañana: la rutina y la planilla.', os.path.join(FINAL, 'canales.md'), os.path.join(SRC, 'canales.built.md')),
    ('prospeccion', '02', 'Mensajes de prospección',                 'Al escribir el primer mensaje y los tres toques de seguimiento.', os.path.join(FINAL, 'prospeccion.md'), os.path.join(SRC, 'prospeccion.built.md')),
    ('venta',       '03', 'Guion de venta del diagnóstico',          'Cuando alguien contesta: de la respuesta al pago de los US$249.', os.path.join(FINAL, 'venta.md'), os.path.join(SRC, 'venta.repaired.md')),
    ('objeciones',  '04', 'Banco de objeciones',                     'Abierto al lado durante cualquier conversación. Incluye cuáles no se responden.', os.path.join(FINAL, 'objeciones.md'), os.path.join(SRC, 'objeciones.built.md')),
    ('sesion',      '05', 'Los 90 minutos',                          'La sesión pagada, bloque a bloque. Los 20 minutos previos y el después.', os.path.join(FINAL, 'sesion.md'), os.path.join(SRC, 'sesion.built.md')),
    ('entregable',  '06', 'Plantilla del Mapa de Fugas',             'El documento que el cliente recibe el mismo día. Con un ejemplo ilustrativo completo.', os.path.join(FINAL, 'entregable.md'), os.path.join(SRC, 'entregable.repaired.md')),
    ('puente',      '07', 'Del diagnóstico a la implementación',     'Donde está el 70% del mes: nivel, propuesta, pago, recurrente y la captura de prueba.', os.path.join(FINAL, 'puente.md'), os.path.join(SRC, 'puente.repaired.md')),
    ('gratuito',    '08', 'El escalón gratuito',                     'Lo que se le manda al que hoy no califica. Un documento, una vez, sin cadencia comprometida.', os.path.join(FINAL, 'gratuito.md'), None),
    ('verificacion','09', 'Verificación cruzada y plan del domingo', 'Lo que quedó por confirmar y qué preparar antes del lunes, con tiempos.', os.path.join(FINAL, 'verificacion.md'), None),
]

def read(path):
    try:
        with open(path, encoding='utf-8') as f:
            return f.read()
    except FileNotFoundError:
        return None

SEC_TITLES = {}   # "9" -> "La planilla (única, …)", filled while rendering the hoja

def render(md_text, key=''):
    body = markdown.markdown(md_text, extensions=['tables', 'sane_lists', 'fenced_code'], output_format='html5')
    # wrap tables so wide ones scroll inside their own container
    body = body.replace('<table>', '<div class="tbl"><table>').replace('</table>', '</table></div>')

    if key == 'hoja':
        # give every numbered section a stable anchor: <h2 id="hoja-9">
        def anchor(m):
            n, rest = m.group(1), m.group(2)
            SEC_TITLES[n] = re.sub(r'<[^>]+>', '', rest).strip()
            return f'<h2 id="hoja-{n}">{n}. {rest}</h2>'
        body = re.sub(r'<h2>(\d+)\.\s*(.*?)</h2>', anchor, body)
    else:
        # make every cross-reference to the sheet a link to the exact section
        def link(m):
            head, nums = m.group(1), m.group(2)
            n = re.findall(r'\d+', nums)[0]
            title = SEC_TITLES.get(n, '')
            t = f' title="{html.escape(title)}"' if title else ''
            return f'<a class="xref" href="#hoja-{n}"{t}>{head}{nums}</a>'
        body = re.sub(
            r'((?:hoja|Hoja)(?:\s+de\s+n[úu]meros)?,?\s+)(secci[óo]n(?:es)?\s+\d+(?:\s+y\s+\d+)?)',
            link, body)
        body = re.sub(
            r'\b((?:hoja|Hoja)\s+)(\d+)\b',
            lambda m: f'<a class="xref" href="#hoja-{m.group(2)}"'
                      + (f' title="{html.escape(SEC_TITLES[m.group(2)])}"' if m.group(2) in SEC_TITLES else '')
                      + f'>{m.group(1)}{m.group(2)}</a>',
            body)
        body = re.sub(r'\b((?:ver\s+)?hoja de n[úu]meros)\b(?![^<]*</a>)',
                      r'<a class="xref" href="#hoja">\1</a>', body)
    return body

nav, options, sections = [], [], []
missing = []
for key, num, title, use, path, fallback in PIECES:
    md = read(path)
    warn = ''
    if md is None or len(md) < 400:
        if fallback and read(fallback):
            md = read(fallback)
            warn = '<div class="warn"><strong>Versión provisoria.</strong> La reconciliación de esta pieza no llegó; esta es la versión anterior, sin alinear a la hoja de números. Ante cualquier diferencia, manda la hoja.</div>'
            missing.append(key)
        else:
            md = md or '_Pieza no disponible._'
            missing.append(key)
    if key == 'hoja':
        nav.append('<div class="group">Fuente de verdad</div>')
    elif key == 'canales':
        nav.append('<div class="group">En orden de uso</div>')
    elif key == 'verificacion':
        nav.append('<div class="group">Control</div>')
    nav.append(f'<a href="#{key}" data-target="{key}"><span class="k">{num}</span><span>{html.escape(title)}</span></a>')
    options.append(f'<option value="{key}">{num} · {html.escape(title)}</option>')
    sections.append(
        f'<section class="piece" id="{key}" aria-labelledby="h-{key}">'
        f'<p class="tag" id="h-{key}">{num} · {html.escape(title)}</p>'
        f'<p class="use">{html.escape(use)}</p>{warn}'
        f'<div class="md" id="md-{key}">{render(md, key)}</div></section>'
    )

hoja = read(os.path.join(BASE, 'hoja-numeros.md')) or ''
confirm_items = []
sec10 = hoja.split('## 10.', 1)
if len(sec10) == 2:
    for line in sec10[1].splitlines():
        m = re.match(r'\s*(\d+)\.\s+(.*)', line)
        if m:
            confirm_items.append(m.group(2).strip())
confirm_html = ''.join(
    f'<li><input type="checkbox" id="c{i+1}"><label for="c{i+1}">{html.escape(t)}</label></li>'
    for i, t in enumerate(confirm_items)
)

tpl = read(os.path.join(BASE, 'template.html'))
out = (tpl.replace('<!--NAV-->', '\n'.join(nav))
          .replace('<!--OPTIONS-->', '\n'.join(options))
          .replace('<!--CONFIRM-->', confirm_html)
          .replace('<!--PIECES-->', '\n'.join(sections)))
with open(os.path.join(BASE, 'kit-venta-korvance.html'), 'w', encoding='utf-8') as f:
    f.write(out)
print('built', len(out), 'chars; provisional:', missing, '; confirm items:', len(confirm_items))

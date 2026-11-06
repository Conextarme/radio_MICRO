"""
Descarga los logos de las emisoras y los guarda como carátulas en logos/.

Uso (desde la carpeta del proyecto):
    python scripts/fetch-logos.py            # solo las que aún no tienen logo
    python scripts/fetch-logos.py --all      # vuelve a descargarlos todos

Requiere Python 3.9+ y Pillow (pip install pillow).

De dónde sale cada logo, por orden:
  1. radio-browser.info, buscando la emisora por la URL de su stream.
  2. radio-browser.info, buscando por nombre exacto.
  3. La web oficial de la emisora (apple-touch-icon o icono grande).
Se descartan las imágenes de menos de 48 px. Cada logo se recorta a
cuadrado sobre fondo blanco y se guarda en logos/<slug>.webp (128x128).
logos/index.json lista los slugs disponibles: la web solo pide los logos
que existen y para el resto pinta las iniciales.

Los logos se publican tal cual vienen de la fuente: conviene revisar
logos/hoja-de-contacto.png después de cada ejecución por si alguno no
corresponde a su emisora. Para quitar uno, añade su slug a
logos/excluidos.json y vuelve a ejecutar el script.
"""
import concurrent.futures
import html.parser
import io
import json
import os
import re
import sys
import unicodedata
import urllib.parse
import urllib.request

from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOGO_DIR = os.path.join(ROOT, 'logos')
SIZE = 128
MIN_SOURCE = 48
UA = 'RadioSinMicrocortes/1.0 (logos)'
RB = 'https://de1.api.radio-browser.info/json/stations'


def slugify(name):
    # Debe dar el mismo resultado que logoSlug() en app.js.
    text = unicodedata.normalize('NFD', name)
    text = ''.join(c for c in text if not ('̀' <= c <= 'ͯ'))
    text = re.sub(r'[^a-z0-9]+', '-', text.lower())
    return text.strip('-')


def load_stations():
    items = []
    with open(os.path.join(ROOT, 'stations.json'), encoding='utf-8') as f:
        for s in json.load(f):
            items.append({'name': s['name'], 'stream': s.get('streamUrl'), 'web': s.get('officialUrl')})

    def walk(node):
        if isinstance(node, list):
            for n in node:
                walk(n)
        elif isinstance(node, dict):
            if isinstance(node.get('stream'), str) and node.get('nombre'):
                items.append({'name': node['nombre'], 'stream': node['stream'], 'web': node.get('web')})
            for v in node.values():
                walk(v)

    for fname in ('emisoras-relax.json', 'emisoras-modos.json'):
        with open(os.path.join(ROOT, fname), encoding='utf-8') as f:
            walk(json.load(f))

    unique = {}
    for it in items:
        unique.setdefault(slugify(it['name']), it)
    return unique


def get(url, limit=3_000_000, timeout=12):
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=timeout) as res:
        return res.read(limit), res.geturl()


def get_json(url):
    try:
        data, _ = get(url)
        return json.loads(data)
    except Exception:
        return None


class IconFinder(html.parser.HTMLParser):
    def __init__(self):
        super().__init__()
        self.icons = []

    def handle_starttag(self, tag, attrs):
        if tag != 'link':
            return
        a = dict(attrs)
        rel = (a.get('rel') or '').lower()
        href = a.get('href')
        if not href or 'icon' not in rel:
            return
        size = 0
        m = re.match(r'(\d+)x(\d+)', a.get('sizes') or '')
        if m:
            size = int(m.group(1))
        elif 'apple-touch-icon' in rel:
            size = 180
        self.icons.append((size, href))


def candidates(it):
    if it.get('stream'):
        for s in get_json(RB + '/byurl?url=' + urllib.parse.quote(it['stream'], safe='')) or []:
            if s.get('favicon'):
                yield s['favicon']
    for s in get_json(RB + '/search?limit=5&order=votes&reverse=true&name=' + urllib.parse.quote(it['name'])) or []:
        if s.get('favicon') and s.get('name', '').strip().lower() == it['name'].strip().lower():
            yield s['favicon']
    web = it.get('web')
    if web and web.startswith('http'):
        try:
            page, final = get(web, limit=600_000)
            finder = IconFinder()
            finder.feed(page.decode('utf-8', 'replace'))
            for _, href in sorted(finder.icons, key=lambda x: -x[0]):
                yield urllib.parse.urljoin(final, href)
            yield urllib.parse.urljoin(final, '/apple-touch-icon.png')
        except Exception:
            pass


def to_logo(data):
    img = Image.open(io.BytesIO(data))
    if getattr(img, 'n_frames', 1) > 1:
        img.seek(0)
    if img.format == 'ICO':
        sizes = img.info.get('sizes') or set()
        if sizes:
            img.size = max(sizes)
    img = img.convert('RGBA')
    w, h = img.size
    if min(w, h) < MIN_SOURCE:
        return None
    # Recorta bordes transparentes, centra en un cuadrado blanco con margen.
    bbox = img.getchannel('A').getbbox()
    if bbox:
        img = img.crop(bbox)
    w, h = img.size
    side = max(w, h)
    canvas = Image.new('RGBA', (side, side), (255, 255, 255, 255))
    canvas.alpha_composite(img, ((side - w) // 2, (side - h) // 2))
    pad = int(side * 0.08) if (w != h) else 0
    if pad:
        bigger = Image.new('RGBA', (side + 2 * pad, side + 2 * pad), (255, 255, 255, 255))
        bigger.alpha_composite(canvas, (pad, pad))
        canvas = bigger
    return canvas.convert('RGB').resize((SIZE, SIZE), Image.LANCZOS)


def fetch_one(slug, it):
    for url in candidates(it):
        if not url.startswith('http') or url.lower().split('?')[0].endswith('.svg'):
            continue
        try:
            data, _ = get(url)
            logo = to_logo(data)
        except Exception:
            continue
        if logo is not None:
            logo.save(os.path.join(LOGO_DIR, slug + '.webp'), 'WEBP', quality=82, method=6)
            return slug, url
    return slug, None


def contact_sheet(slugs, names):
    cols = 12
    cell = 150
    rows = (len(slugs) + cols - 1) // cols
    sheet = Image.new('RGB', (cols * cell, max(1, rows) * cell), (26, 11, 46))
    draw = ImageDraw.Draw(sheet)
    for i, slug in enumerate(slugs):
        x, y = (i % cols) * cell, (i // cols) * cell
        with Image.open(os.path.join(LOGO_DIR, slug + '.webp')) as im:
            sheet.paste(im.resize((110, 110)), (x + 20, y + 6))
        draw.text((x + 6, y + 122), names[slug][:24], fill=(244, 241, 251))
    sheet.save(os.path.join(LOGO_DIR, 'hoja-de-contacto.png'))


def load_excluded():
    # Logos revisados a mano que no corresponden a su emisora (genéricos,
    # en blanco, de otra marca): no se descargan y la web usa las iniciales.
    try:
        with open(os.path.join(LOGO_DIR, 'excluidos.json'), encoding='utf-8') as f:
            return set(json.load(f))
    except FileNotFoundError:
        return set()


def main():
    redo = '--all' in sys.argv
    os.makedirs(LOGO_DIR, exist_ok=True)
    stations = load_stations()
    excluded = load_excluded()
    for slug in excluded:
        path = os.path.join(LOGO_DIR, slug + '.webp')
        if os.path.exists(path):
            os.remove(path)
    todo = {s: it for s, it in stations.items()
            if s not in excluded and (redo or not os.path.exists(os.path.join(LOGO_DIR, s + '.webp')))}
    print(f'{len(stations)} emisoras, {len(todo)} por buscar')
    found = 0
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        for slug, src in pool.map(lambda kv: fetch_one(*kv), todo.items()):
            if src:
                found += 1
            print(('OK   ' if src else '--   ') + slug + ('  <- ' + src if src else ''))
    available = sorted(s for s in stations if os.path.exists(os.path.join(LOGO_DIR, s + '.webp')))
    with open(os.path.join(LOGO_DIR, 'index.json'), 'w', encoding='utf-8') as f:
        json.dump(available, f, ensure_ascii=False, indent=0)
        f.write('\n')
    contact_sheet(available, {s: stations[s]['name'] for s in available})
    print(f'Nuevos: {found}. Con logo: {len(available)} de {len(stations)}.')


if __name__ == '__main__':
    main()

import requests
from bs4 import BeautifulSoup
import re
from datetime import datetime, timedelta
import os
import json
import math
from html import escape
try:
    from PIL import Image
except ImportError:  # Pillow is optional; without it sprites stay remote
    Image = None

SPRITE_DIR = os.path.join('assets', 'sprites')
SPRITE_SCALE = 4
FETCH_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36',
    'Referer': 'https://www.focumon.com/',
}

def _scale2x(px, w, h):
    """One Scale2x (EPX) pass over an RGBA pixel list; smooths diagonals without blurring."""
    out = [None] * (w * h * 4)
    W2 = w * 2
    for y in range(h):
        for x in range(w):
            p = px[y * w + x]
            a = px[(y - 1) * w + x] if y > 0 else p
            d = px[(y + 1) * w + x] if y < h - 1 else p
            c = px[y * w + x - 1] if x > 0 else p
            b = px[y * w + x + 1] if x < w - 1 else p
            e0 = e1 = e2 = e3 = p
            if a != d and c != b:
                if c == a: e0 = a
                if a == b: e1 = b
                if d == c: e2 = c
                if b == d: e3 = b
            i = (y * 2) * W2 + x * 2
            out[i] = e0
            out[i + 1] = e1
            out[i + W2] = e2
            out[i + W2 + 1] = e3
    return out

def smooth_sprite(src_bytes):
    """Upscale a pixel-art sprite 4x with two Scale2x passes. Returns a PIL image."""
    import io
    im = Image.open(io.BytesIO(src_bytes)).convert('RGBA')
    w, h = im.size
    px = list(im.getdata())
    for _ in range(2):
        px = _scale2x(px, w, h)
        w, h = w * 2, h * 2
    out = Image.new('RGBA', (w, h))
    out.putdata(px)
    return out

def localize_sprite(url):
    """Download a sprite once, store a smoothed 4x copy locally, and return its relative path.
    Falls back to the remote URL when anything is unavailable."""
    if not url or Image is None:
        return url
    name = url.rstrip('/').split('/')[-1].rsplit('.', 1)[0]
    kind = 'focumon' if '/focumon/' in url else 'trainer'
    filename = f"{kind}-{name}@{SPRITE_SCALE}x.png"
    path = os.path.join(SPRITE_DIR, filename)
    rel = f"assets/sprites/{filename}"
    if os.path.exists(path):
        return rel
    try:
        response = requests.get(url, headers=FETCH_HEADERS, timeout=15)
        response.raise_for_status()
        os.makedirs(SPRITE_DIR, exist_ok=True)
        smooth_sprite(response.content).save(path, optimize=True)
        return rel
    except Exception as e:
        print(f"Sprite fetch failed for {url}: {e}")
        return url

# List of URLs
urls = [
    "https://www.focumon.com/trainers/RitikBhardwaj",
    "https://www.focumon.com/trainers/shreyas",
    "https://www.focumon.com/trainers/akkubhosle1.html",
    "https://www.focumon.com/trainers/NamikazeMi_JoWH",
    "https://www.focumon.com/trainers/rabbitfoot",
    "https://www.focumon.com/trainers/Epic186_LmHD.html",
    "https://www.focumon.com/trainers/Dr4g0n_lQ3J",
    "https://www.focumon.com/trainers/bokuwa_tobi",
    "https://www.focumon.com/trainers/Harshit_777",
    "https://www.focumon.com/trainers/ali_8Luq",
    "https://www.focumon.com/trainers/zix_",
    "https://www.focumon.com/trainers/saamm_qpme",
    "https://www.focumon.com/trainers/kuro_M3Cr",
    "https://www.focumon.com/trainers/bugbountyhunter.html",
    "https://www.focumon.com/trainers/Kheneh_V62t.html",
    "https://www.focumon.com/trainers/anonymousp_jqMr",
    "https://www.focumon.com/trainers/t3po",
    "https://www.focumon.com/trainers/Elden_lord_xY0b",
    "https://www.focumon.com/trainers/bhvrvt",
    "https://www.focumon.com/trainers/chaithu_QmSm",
    "https://www.focumon.com/trainers/SShbounty_cbhK",
    "https://www.focumon.com/trainers/Shubham_Kh_V9WH",
    "https://www.focumon.com/trainers/uday",
    "https://focumon.com/trainers/Momehrust_l0E4",
    "https://www.focumon.com/trainers/Srishti_QuOP",
    "https://www.focumon.com/trainers/Yash_fren",
    "https://www.focumon.com/trainers/AH_6MbD",
    "https://www.focumon.com/trainers/Atom_le_Bi_2yjR",
    "https://www.focumon.com/trainers/0x04ft",
    "https://www.focumon.com/trainers/Apoorv_S6ag",
    "https://www.focumon.com/trainers/Sidduuuuu"
]

def load_history():
    """Load historical data from history_current.json, or fallback to history.json for migration"""
    try:
        with open('history_current.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        try:
            with open('history.json', 'r') as f:
                history = json.load(f)
                # Migrate to new file name
                with open('history_current.json', 'w') as f2:
                    json.dump(history, f2, indent=2)
                return history
        except FileNotFoundError:
            return {}

def save_history(history):
    """Save historical data to history_current.json"""
    with open('history_current.json', 'w') as f:
        json.dump(history, f, indent=2)

def update_history(history, current_dict):
    """Update history with current flowers and rank for today, and move data older than 90 days to yearly archive files"""
    today = datetime.now().date().isoformat()
    ninety_days_ago = (datetime.now().date() - timedelta(days=90)).isoformat()
    
    # First, update the current history with today's data
    for trainer_id, data in current_dict.items():
        flowers = data['flowers']
        rank = data['rank']
        if trainer_id not in history:
            history[trainer_id] = []
        # Remove any entry for today if exists (overwrite)
        history[trainer_id] = [entry for entry in history[trainer_id] if entry['date'] != today]
        history[trainer_id].append({'date': today, 'rank': rank, 'flowers': flowers})
    
    # Now, remove entries older than 90 days from current history and add them to archive
    archive_entries = {}  # key: year, value: dict of trainer_id to list of entries for that year
    for trainer_id, entries in history.items():
        keep_entries = []
        for entry in entries:
            if entry['date'] >= ninety_days_ago:
                keep_entries.append(entry)
            else:
                # This entry is old, so add to archive
                year = entry['date'][:4]  # extract year from date string
                if year not in archive_entries:
                    archive_entries[year] = {}
                if trainer_id not in archive_entries[year]:
                    archive_entries[year][trainer_id] = []
                archive_entries[year][trainer_id].append(entry)
        history[trainer_id] = keep_entries
    
    # For each year in archive_entries, load the corresponding archive file, merge entries, and save
    for year, year_data in archive_entries.items():
        archive_filename = f"history_{year}.json"
        if os.path.exists(archive_filename):
            with open(archive_filename, 'r') as f:
                archive_history = json.load(f)
        else:
            archive_history = {}
        
        for trainer_id, entries in year_data.items():
            if trainer_id not in archive_history:
                archive_history[trainer_id] = []
            # Avoid duplicates by checking dates
            existing_dates = {entry['date'] for entry in archive_history[trainer_id]}
            for entry in entries:
                if entry['date'] not in existing_dates:
                    archive_history[trainer_id].append(entry)
            # Sort entries by date for consistency
            archive_history[trainer_id].sort(key=lambda x: x['date'])
        
        with open(archive_filename, 'w') as f:
            json.dump(archive_history, f, indent=2)
    
    return history

def get_rank_change(history, trainer_id):
    """Get the rank from 7 days ago for a trainer. Returns None if not available."""
    seven_days_ago = (datetime.now().date() - timedelta(days=7)).isoformat()
    if trainer_id not in history:
        return None
    for entry in history[trainer_id]:
        if entry['date'] == seven_days_ago:
            return entry['rank']
    return None

def get_title(history_entries):
    """Assign a title based on the last 7 days of flower data."""
    if not history_entries:
        return "Newcomer"
    
    # Sort entries by date and get entries with flowers
    sorted_entries = sorted(history_entries, key=lambda x: x['date'])
    # Only consider entries that have 'flowers' key
    valid_entries = [entry for entry in sorted_entries if 'flowers' in entry]
    if len(valid_entries) < 7:
        return "Newcomer"
    
    flowers_list = [entry['flowers'] for entry in valid_entries][-7:]
    # Calculate average of first 6 days and compare to last day
    avg_old = sum(flowers_list[:-1]) / 6
    last_day = flowers_list[-1]
    
    if last_day > avg_old * 1.5:
        return "Rising Star"
    elif last_day < avg_old * 0.5:
        return "Slumping"
    else:
        mean = sum(flowers_list) / 7
        if mean < 75:
            return "Average"
        variance = sum((x - mean) ** 2 for x in flowers_list) / 7
        std_dev = math.sqrt(variance)
        coeff_var = std_dev / mean
        if coeff_var < 0.1:
            return "Consistent Performer"
        else:
            return "Average"

def extract_flowers_name_and_avatars(url):
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Extract display name
        name_tag = soup.find('h1')
        display_name = name_tag.text.strip() if name_tag else "Unknown"
        
        # Find text containing "last 7 days"
        flowers = 0
        matches = soup.find_all(string=re.compile(r'last 7 days', re.I))
        for match in matches:
            num_match = re.search(r'\d+', match)
            if num_match:
                flowers = int(num_match.group())
                break
        
        # Extract trainer and focumon avatars
        avatar_container = soup.find('div', class_='flex gap-x-2 justify-center items-end mb-2 font-sans font-bold')
        trainer_avatar = None
        focumon_avatar = None
        
        if avatar_container:
            # Get trainer avatar
            trainer_div = avatar_container.find('div', class_='z-20')
            if trainer_div:
                trainer_img = trainer_div.find('img')
                if trainer_img and trainer_img.get('src'):
                    trainer_avatar = "https://www.focumon.com" + trainer_img['src'] if trainer_img['src'].startswith('/') else trainer_img['src']
            
            # Get focumon avatar
            focumon_div = avatar_container.find('div', class_='z-10')
            if focumon_div:
                focumon_img = focumon_div.find('img')
                if focumon_img and focumon_img.get('src'):
                    focumon_avatar = "https://www.focumon.com" + focumon_img['src'] if focumon_img['src'].startswith('/') else focumon_img['src']
        
        return display_name, flowers, trainer_avatar, focumon_avatar
    except Exception as e:
        print(f"Error fetching {url}: {str(e)}")
        return "Error", 0, None, None

# ---------------------------------------------------------------------------
# Presentation helpers
# ---------------------------------------------------------------------------

FLOWER_COLORS = ['#4f7cff', '#ff7a59', '#b48cff', '#3ddc97']
METAL_COLORS = {1: '#ffc542', 2: '#cdd5ea', 3: '#d9925a'}
CONSISTENCY_LINE = 75

def _avatar_img(src, css_class, alt):
    """Return an <img> for an avatar URL, or nothing when it is missing."""
    if src:
        return f'<img src="{escape(src)}" class="{css_class}" alt="{escape(alt)}">'
    return ''

def format_hours(hours):
    """Format hours compactly: 53.0 -> '53', 32.67 -> '32.7'."""
    if float(hours).is_integer():
        return str(int(hours))
    return f"{hours:.1f}"

def rank_change_html(rank_change):
    """Return a pill showing the 7-day rank movement."""
    if rank_change is None:
        return '<span class="pill pill-new" title="No data from 7 days ago">new</span>'
    if rank_change > 0:
        return f'<span class="pill pill-up"><span aria-hidden="true">&#9650;</span>{rank_change}<span class="sr-only"> places up</span></span>'
    if rank_change < 0:
        return f'<span class="pill pill-down"><span aria-hidden="true">&#9660;</span>{abs(rank_change)}<span class="sr-only"> places down</span></span>'
    return '<span class="pill pill-flat"><span aria-hidden="true">&#8212;</span><span class="sr-only">no change</span></span>'

def _week_bars(d):
    """Seven tiny bars for the last week, coloured against the line."""
    vals = d['series30'][-7:]
    top = max([v for v in vals if v is not None] + [CONSISTENCY_LINE, 1])
    out = ''
    for v in vals:
        if v is None:
            out += '<i class="wb wb-na"></i>'
        else:
            out += f'<i class="wb {"wb-up" if v >= CONSISTENCY_LINE else "wb-low"}" style="height:{max(12, v / top * 100):.0f}%"></i>'
    return out

def podium_change_html(d):
    """Two short lines under a podium block: flowers vs last week, then rank movement."""
    g = d['gain7']
    rc = d['rank_change']
    gtxt = '&plusmn;0' if g == 0 else ('&#8212;' if g is None else (f'+{g}' if g > 0 else f'&minus;{abs(g)}'))
    gcls = 'delta-up' if (g or 0) > 0 else ('delta-down' if (g or 0) < 0 else 'delta-flat')
    if rc is None or rc == 0:
        return f'<span class="delta {gcls}">Held #{d["rank"]} &middot; <span class="delta-num">{gtxt}</span><span class="delta-word"> flowers</span></span>'
    if rc > 0:
        return f'<span class="delta {gcls}"><span class="delta-arrow" aria-hidden="true">&#9650;</span>Up {rc} to #{d["rank"]} &middot; <span class="delta-num">{gtxt}</span><span class="delta-word"> flowers</span></span>'
    return f'<span class="delta {gcls}"><span class="delta-arrow" aria-hidden="true">&#9660;</span>Down {abs(rc)} to #{d["rank"]} &middot; <span class="delta-num">{gtxt}</span><span class="delta-word"> flowers</span></span>'
    # (unreachable legacy branches kept below for reference)
    if g is None:
        first = '<span class="delta delta-flat">First week on the board</span>'
    elif g > 0:
        first = f'<span class="delta delta-up"><span class="delta-arrow" aria-hidden="true">&#9650;</span><span class="delta-num">+{g}</span><span class="delta-word"> flowers</span><span class="delta-rest"> vs last week</span></span>'
    elif g < 0:
        first = f'<span class="delta delta-down"><span class="delta-arrow" aria-hidden="true">&#9660;</span><span class="delta-num">&minus;{abs(g)}</span><span class="delta-word"> flowers</span><span class="delta-rest"> vs last week</span></span>'
    else:
        first = '<span class="delta delta-flat">&plusmn;0 flowers vs last week</span>'
    if rc is None or rc == 0:
        second = '<span class="delta delta-muted">Held the spot</span>'
    elif rc > 0:
        second = f'<span class="delta delta-up">Up {rc} place{"s" if rc != 1 else ""}</span>'
    else:
        second = f'<span class="delta delta-down">Down {abs(rc)} place{"s" if abs(rc) != 1 else ""}</span>'
    return first + second

def gain_html(gain):
    """Return a signed flower delta versus 7 days ago."""
    if gain is None:
        return '<span class="gain gain-none">&#8212;</span>'
    if gain > 0:
        return f'<span class="gain gain-up">+{gain}</span>'
    if gain < 0:
        return f'<span class="gain gain-down">&minus;{abs(gain)}</span>'
    return '<span class="gain gain-flat">0</span>'

# ---------------------------------------------------------------------------
# Analytics derived from history
# ---------------------------------------------------------------------------

def _history_map(entries):
    return {e['date']: e for e in entries if 'date' in e}

def compute_extras(history, trainer_id, flowers):
    """Return (series14, gain7, days_above_line_30, days_tracked_30) for a trainer."""
    today = datetime.now().date()
    hm = _history_map(history.get(trainer_id, []))

    series14 = []
    for i in range(13, -1, -1):
        entry = hm.get((today - timedelta(days=i)).isoformat())
        series14.append(entry['flowers'] if entry and 'flowers' in entry else None)
    series30 = []
    for i in range(29, -1, -1):
        entry = hm.get((today - timedelta(days=i)).isoformat())
        series30.append(entry['flowers'] if entry and 'flowers' in entry else None)

    week_ago = hm.get((today - timedelta(days=7)).isoformat())
    gain7 = flowers - week_ago['flowers'] if week_ago and 'flowers' in week_ago else None

    tracked = above = 0
    for i in range(30):
        entry = hm.get((today - timedelta(days=i)).isoformat())
        if entry and 'flowers' in entry:
            tracked += 1
            if entry['flowers'] >= CONSISTENCY_LINE:
                above += 1
    return series14, series30, gain7, above, tracked

def group_series(history, days=30):
    """Total flowers across all trainers for each of the last `days` days."""
    today = datetime.now().date()
    totals = {}
    for entries in history.values():
        for e in entries:
            if 'date' in e and 'flowers' in e:
                totals[e['date']] = totals.get(e['date'], 0) + e['flowers']
    out = []
    for i in range(days - 1, -1, -1):
        out.append(totals.get((today - timedelta(days=i)).isoformat()))
    return out

def pick_spotlights(data):
    """Choose three spotlights, never featuring the same trainer twice."""
    used = set()
    spots = []

    def take(label, candidates, key, detail):
        pool = [d for d in candidates if d['id'] not in used]
        if not pool:
            return
        best = max(pool, key=key)
        used.add(best['id'])
        spots.append((label, best, detail(best)))

    take('Most improved', [d for d in data if d['gain7'] is not None and d['gain7'] > 0],
         lambda d: d['gain7'], lambda d: f"+{d['gain7']} flowers this week")
    take('Most consistent', [d for d in data if d['days30'] >= 7 and d['above30'] > 0],
         lambda d: (d['above30'] / d['days30'], d['flowers']), lambda d: f"{d['above30']} of {d['days30']} days above {CONSISTENCY_LINE}")
    take('Biggest climb', [d for d in data if d['rank_change'] is not None and d['rank_change'] > 0],
         lambda d: (d['rank_change'], d['flowers']), lambda d: f"up {d['rank_change']} places to #{d['rank']}")
    if len(spots) < 3:
        take('Closest to the line', [d for d in data if 0 < d['flowers'] < CONSISTENCY_LINE],
             lambda d: d['flowers'], lambda d: f"{CONSISTENCY_LINE - d['flowers']} flowers short of {CONSISTENCY_LINE}")
    if len(spots) < 3:
        take('Most hours', [d for d in data if d['flowers'] > 0],
             lambda d: d['flowers'], lambda d: f"{format_hours(d['hours'])} hours of focus this week")
    return spots[:3]

# ---------------------------------------------------------------------------
# Inline SVG generators
# ---------------------------------------------------------------------------

def _path_from_points(points):
    d, pen_down = [], False
    for p in points:
        if p is None:
            pen_down = False
            continue
        x, y = p
        d.append(f"{'L' if pen_down else 'M'}{x:.1f},{y:.1f}")
        pen_down = True
    return ' '.join(d)

def sparkline_svg(values, scale_max, width=160, height=36, line=CONSISTENCY_LINE):
    """Small 14-day trend line with the consistency line drawn through it."""
    pad = 3
    n = max(len(values), 2)
    scale_max = max(scale_max, 1)
    x = lambda i: pad + i * (width - 2 * pad) / (n - 1)
    y = lambda v: height - pad - (min(v, scale_max) / scale_max) * (height - 2 * pad)
    points = [(x(i), y(v)) if v is not None else None for i, v in enumerate(values)]
    path = _path_from_points(points)
    last = next((p for p in reversed(points) if p is not None), None)
    dot = f'<circle class="spark-dot" cx="{last[0]:.1f}" cy="{last[1]:.1f}" r="2.2"/>' if last else ''
    line_svg = ''
    if line <= scale_max:
        ly = y(line)
        line_svg = f'<line class="spark-line" x1="0" x2="{width}" y1="{ly:.1f}" y2="{ly:.1f}"/>'
    return (f'<svg class="spark" viewBox="0 0 {width} {height}" width="{width}" height="{height}" aria-hidden="true">'
            f'{line_svg}<path class="spark-path" d="{path}"/>{dot}</svg>')

def group_chart_svg(series, width=600, height=110):
    """Full-width area chart of the group's total flowers over the last 30 days."""
    vals = [v for v in series if v is not None]
    if not vals:
        return ''
    pad = 3
    n = max(len(series), 2)
    top = max(vals) or 1
    lo = min(vals) * 0.8
    span = max(top - lo, 1)
    x = lambda i: pad + i * (width - 2 * pad) / (n - 1)
    y = lambda v: height - pad - ((v - lo) / span) * (height - 2 * pad)
    points = [(x(i), y(v)) if v is not None else None for i, v in enumerate(series)]
    line = _path_from_points(points)
    solid = [p for p in points if p is not None]
    area = f"M{solid[0][0]:.1f},{height} " + ' '.join(f"L{px:.1f},{py:.1f}" for px, py in solid) + f" L{solid[-1][0]:.1f},{height} Z"
    last = solid[-1]
    band_x = x(max(0, n - 7))
    return (f'<svg class="group-spark" viewBox="0 0 {width} {height}" preserveAspectRatio="none" aria-hidden="true">'
            f'<defs><linearGradient id="bandg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="currentColor" stop-opacity="0.22"/><stop offset="1" stop-color="currentColor" stop-opacity="0.02"/></linearGradient></defs>'
            f'<rect class="group-band" x="{band_x:.1f}" y="0" width="{width - band_x:.1f}" height="{height}"/>'
            f'<path class="group-area" d="{area}"/><path class="group-line" d="{line}" vector-effect="non-scaling-stroke"/></svg>'
            f'<span class="group-dot" style="left:{last[0] / width * 100:.1f}%;top:{last[1] / height * 100:.1f}%"></span>')

def community_delta(series):
    """Week-on-week change of the community total, as (delta, percent) or None."""
    vals = [v for v in series if v is not None]
    if len(series) < 8 or series[-1] is None or series[-8] is None or not series[-8]:
        return None
    delta = series[-1] - series[-8]
    return delta, round(delta / series[-8] * 100)

def _pixel_flower(flowers, max_flowers, color, idx, avatar=None, rank=None, show_count=False):
    """Return SVG for one flower drawn relative to its base at (0, 0). The head is the trainer's face."""
    ratio = (flowers / max_flowers) if max_flowers > 0 else 0
    import math as _m
    seedling = flowers <= 0
    podium = rank is not None and rank <= 3
    if seedling:
        stem_h, r = 30, 7.5
    else:
        stem_h = 22 + ratio * 208
        r = (9 + ratio * 10) * (1.0 if podium else 0.8)   # head radius; mid ranks stay smaller than the leaders
    u = r * 0.62                # petal size
    face_opacity = 0.5 if seedling else 1
    cx, cy = 0, -stem_h
    leaf_y = -stem_h * (0.45 + 0.1 * (idx % 3))
    leaf_side = -1 if idx % 2 else 1
    petals = ''
    for k in range(6):
        ang = k * _m.pi / 3 + _m.pi / 6
        px_, py_ = cx + _m.cos(ang) * (r + u * 0.55), cy + _m.sin(ang) * (r + u * 0.55)
        petals += (f'<rect x="{px_ - u / 2:.1f}" y="{py_ - u / 2:.1f}" width="{u:.1f}" height="{u:.1f}" rx="{u * 0.28:.1f}" '
                   f'fill="{color}" stroke="rgba(0,0,0,0.35)" stroke-width="1.2" transform="rotate({k * 60 + 30:.0f} {px_:.1f} {py_:.1f})"/>')
    if not seedling and flowers >= CONSISTENCY_LINE:
        ly2 = -stem_h * 0.72
        petals += (f'<rect x="{2 if leaf_side < 0 else -9}" y="{ly2:.1f}" width="7" height="4" fill="#57b85f"/>'
                   f'<rect x="{-9 if leaf_side < 0 else 2}" y="{ly2 + 12:.1f}" width="7" height="4" fill="#57b85f"/>')
    head = ''
    if avatar:
        w = r * 3.0
        head = (f'<clipPath id="fc{idx}"><circle cx="{cx}" cy="{cy:.1f}" r="{r - 1:.1f}"/></clipPath>'
                f'<circle cx="{cx}" cy="{cy:.1f}" r="{r:.1f}" fill="{"#c9d0e6" if seedling else "#fff3b0"}"/>'
                f'<image href="{escape(avatar)}" x="{cx - w / 2:.1f}" y="{cy - w * 0.27:.1f}" width="{w:.1f}" height="{w:.1f}" clip-path="url(#fc{idx})" preserveAspectRatio="xMidYMid slice" opacity="{face_opacity}"/>'
                f'<circle cx="{cx}" cy="{cy:.1f}" r="{r:.1f}" fill="none" stroke="{color}" stroke-width="{1.8 if seedling else 2.5}"/>'
                f'<circle cx="{cx}" cy="{cy + 0.6:.1f}" r="{r + 1.6:.1f}" fill="none" stroke="rgba(0,0,0,0.35)" stroke-width="1.4"/>')
    else:
        head = f'<circle cx="{cx}" cy="{cy:.1f}" r="{r:.1f}" fill="#fff3b0" stroke="{color}" stroke-width="2.5"/>'
    if seedling:
        head = (f'<circle cx="{cx}" cy="{cy:.1f}" r="{r:.1f}" fill="#dfe6ff" stroke="{color}" stroke-width="1.8"/>'
                f'<circle cx="{cx}" cy="{cy:.1f}" r="{r * 0.4:.1f}" fill="{color}"/>')
        return (f'<g class="sprout"><rect x="-2" y="{-stem_h:.1f}" width="4" height="{stem_h:.1f}" fill="#3f9d4c"/>'
                f'<rect x="-11" y="-16" width="9" height="4" fill="#57b85f"/>{petals}{head}</g>')
    extras = ''
    if rank is not None and rank <= 3:
        bx, by = cx - r * 0.85, cy - r * 0.85
        extras += (f'<circle cx="{bx:.1f}" cy="{by:.1f}" r="7.5" fill="#fff" stroke="{color}" stroke-width="1.5"/>'
                   f'<text class="flower-rank" x="{bx:.1f}" y="{by + 3.4:.1f}" text-anchor="middle">{rank}</text>')
    if show_count:
        extras += f'<text class="flower-count{"" if podium else " flower-count-sm"}" x="{cx}" y="{cy - r - u - 5:.1f}" text-anchor="middle">{flowers}</text>'
    return (f'<rect x="-2" y="{-stem_h:.1f}" width="4" height="{stem_h:.1f}" fill="#3f9d4c"/>'
            f'<rect x="{leaf_side * 2 if leaf_side > 0 else -9}" y="{leaf_y:.1f}" width="7" height="4" fill="#57b85f"/>'
            f'{petals}{head}{extras}')

def garden_svg(data, max_flowers):
    """The hero scene: every trainer is a flower whose height is their flower count."""
    W, H = 1000, 400
    back_ground = 330   # where the flowers are planted
    front_ground = 372  # the path where the leaders stand
    n = len(data)
    centre = 520
    kmax = max(2, n // 2)
    spacing = (440 - 92) / max(1, kmax - 2)
    parts = []

    # Distant hills and the flower bed
    parts.append('<g class="hills">'
                 '<ellipse cx="180" cy="332" rx="260" ry="46" fill="#2f7a3d"/>'
                 '<ellipse cx="620" cy="336" rx="320" ry="52" fill="#2c7239"/>'
                 '<ellipse cx="930" cy="334" rx="220" ry="40" fill="#2f7a3d"/></g>')
    parts.append(f'<rect class="bed" x="0" y="{back_ground}" width="{W}" height="{front_ground - back_ground}" fill="#3a8a45"/>')
    tufts = ''.join(f'<rect x="{(i * 137 + (i % 3) * 11) % W}" y="{back_ground - 2 - (i % 4) * 2}" width="{3 + i % 3}" height="{3 + (i % 4) * 2}" fill="{'#5cc46a' if i % 2 else '#4db35c'}"/>' for i in range(30))
    parts.append(f'<g class="tufts">{tufts}</g>')

    # Trees on the hills and a pond on the bed
    def tree(x, base, h, shade):
        return (f'<g class="tree"><rect x="{x - 5}" y="{base - h}" width="10" height="{h}" fill="#5a3d2b"/>'
                f'<rect x="{x - 26}" y="{base - h - 4}" width="52" height="20" fill="{shade}"/>'
                f'<rect x="{x - 20}" y="{base - h - 20}" width="40" height="18" fill="{shade}"/>'
                f'<rect x="{x - 12}" y="{base - h - 34}" width="24" height="16" fill="{shade}"/></g>')
    parts.append('<g class="trees">' + tree(70, back_ground - 2, 46, '#2b7a3b') + tree(150, back_ground - 6, 36, '#33934a')
                 + tree(905, back_ground - 4, 42, '#2b7a3b') + tree(965, back_ground - 8, 30, '#33934a') + '</g>')
    parts.append(f'<g class="pond"><ellipse cx="120" cy="{back_ground + 20}" rx="58" ry="9" fill="#2f7fb0"/>'
                 f'<ellipse cx="120" cy="{back_ground + 19}" rx="50" ry="6" fill="#4cc9f0"/>'
                 f'<rect class="pond-glint" x="100" y="{back_ground + 15}" width="10" height="2" fill="#dff7ff"/></g>')

    # Consistency line
    if max_flowers >= CONSISTENCY_LINE:
        line_y = back_ground - (22 + (CONSISTENCY_LINE / max_flowers) * 208)
        parts.append(f'<g class="line75"><line x1="0" x2="{W}" y1="{line_y:.1f}" y2="{line_y:.1f}"/>'
                     f'<text x="{W - 12}" y="{line_y - 6:.1f}" text-anchor="end">{CONSISTENCY_LINE} flowers</text>'
                     f'<text class="line75-m" x="706" y="{line_y - 6:.1f}" text-anchor="end">{CONSISTENCY_LINE}</text></g>')

    # Flowers: leader in the centre, then alternating outward by rank
    flowers = []
    podium_x = {1: 500, 2: 330, 3: 670}
    dead = {500: 130, 330: 84, 670: 84}
    flower_x = {1: 452, 2: 394, 3: 712}   # stems clear of the sprites standing on the blocks

    def head_of(d):
        ratio = (d['flowers'] / max_flowers) if max_flowers > 0 else 0
        if d['flowers'] <= 0:
            return 7.5, 30
        return (9 + ratio * 10) * (1.0 if d['rank'] <= 3 else 0.8), 22 + ratio * 208

    placed = []  # (x, head_radius, stem_h)
    for c, dz in dead.items():
        placed.append((c, 0, 0))

    def clear(x, r, h):
        for c, dz in dead.items():
            if abs(x - c) < dz:
                return False
        for px_, pr, ph in placed:
            if pr == 0:
                continue
            if abs(x - px_) < (r + pr) * 1.25 and abs(h - ph) < (r + pr) * 1.6:
                return False
        return True

    positions = {}
    side = 1
    for d in data:
        if d['rank'] in podium_x:
            x = flower_x[d['rank']]
            r, h = head_of(d)
            positions[d['id']] = x
            placed.append((x, r, h))
            continue
        if d['flowers'] <= 0:
            continue  # seedlings are spread separately below
        r, h = head_of(d)
        x = None
        offset = 0
        while offset <= 470:
            for s_ in (side, -side):
                cand = 500 + s_ * offset
                if 40 <= cand <= 960 and clear(cand, r, h):
                    x = cand
                    break
            if x is not None:
                break
            offset += 14
        if x is None:  # no clear slot left: fall back to the emptiest edge
            x = 40 + (len(placed) * 37) % 920
        side = -side
        positions[d['id']] = x
        placed.append((x, r, h))

    seedlings = [d for d in data if d['flowers'] <= 0]
    free = [sx for sx in range(40, 961, 4) if all(abs(sx - c) > dz - 10 for c, dz in dead.items())]
    for i, d in enumerate(seedlings):
        j = int((i + 0.5) / max(len(seedlings), 1) * len(free))
        positions[d['id']] = free[min(j, len(free) - 1)]

    for idx, d in enumerate(data):
        x = positions[d['id']]
        jitter = ((idx * 7) % 9) - 4
        if d['flowers'] <= 0:
            jitter = 2 + (idx % 2) * 10   # two loose rows
        color = METAL_COLORS.get(d['rank']) or FLOWER_COLORS[idx % len(FLOWER_COLORS)]
        delay = (idx * 0.37) % 3
        flowers.append(
            f'<g class="flower" data-id="{escape(d["id"])}" data-name="{escape(d["name"])}" data-flowers="{d["flowers"]}" data-rank="{d["rank"]}" '
            f'transform="translate({x:.1f},{back_ground + jitter})" tabindex="0" role="link" aria-label="{escape(d["name"])}, rank {d["rank"]}, {d["flowers"]} flowers">'
            f'<g class="sway" style="--g:{(idx % 12) * 0.06:.2f}s;--sd:-{delay:.2f}s">{_pixel_flower(d["flowers"], max_flowers, color, idx, d["avatar"], d["rank"], d["flowers"] >= CONSISTENCY_LINE)}</g></g>')
    parts.append('<g class="flowers">' + ''.join(flowers) + '</g>')

    # Front path
    parts.append(f'<rect class="path" x="0" y="{front_ground}" width="{W}" height="{H - front_ground}" fill="#6b4a33"/>')
    parts.append(f'<rect x="0" y="{front_ground}" width="{W}" height="3" fill="#8a6446"/>')


    # Night-only fireflies
    fireflies = ''.join(f'<circle class="firefly" cx="{(i * 211) % W}" cy="{170 + (i * 53) % 150}" r="2" style="animation-delay:-{(i * 0.9) % 6:.1f}s"/>' for i in range(14))
    parts.append(f'<g class="fireflies">{fireflies}</g>')

    return (f'<svg class="garden" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMax meet" aria-label="Garden of {n} trainers; taller flowers mean more flowers collected">'
            + ''.join(parts) + '</svg>')

# ---------------------------------------------------------------------------
# HTML fragments
# ---------------------------------------------------------------------------

def trainer_json(data):
    """Per-trainer data embedded in the page for the in-place trainer card."""
    total = len(data)
    payload = [{
        'id': d['id'], 'name': d['name'], 'rank': d['rank'], 'total': total,
        'flowers': d['flowers'], 'gain7': d['gain7'], 'rank_change': d['rank_change'],
        'title': d['title'], 'above30': d['above30'], 'days30': d['days30'],
        'avatar': d['avatar'], 'focumon': d['focumon'], 'series30': d['series30'],
        'line': CONSISTENCY_LINE, 'end': datetime.now().date().isoformat(),
    } for d in data]
    return json.dumps(payload, separators=(',', ':')).replace('</', '<\\/')

def generate_top_three_html(data):
    """Podium cards for the top three."""
    html = ''
    for d in data[:3]:
        name = escape(d['name'])
        html += f"""
            <a class="podium-card place-{d['rank']}" href="users/user_{escape(d['id'])}.html" data-id="{escape(d['id'])}">
                <span class="place-badge" aria-label="Rank {d['rank']}">{d['rank']}</span>
                <span class="podium-avatars">
                    {_avatar_img(d['avatar'], 'trainer-avatar', d['name'])}
                    {_avatar_img(d['focumon'], 'focumon-avatar', 'Focumon partner')}
                </span>
                <span class="podium-name">{name}</span>
                <span class="podium-title">{d['above30']} of {d['days30']} days above {CONSISTENCY_LINE}</span>
                <span class="podium-stats">
                    <span class="podium-stat"><span class="num count" data-count="{d['flowers']}">{d['flowers']}</span><span class="label">flowers</span></span>
                    <span class="podium-stat"><span class="num count" data-count="{format_hours(d['hours'])}">{format_hours(d['hours'])}</span><span class="label">hours</span></span>
                </span>
                <span class="podium-change">{podium_change_html(d)}</span>
                <span class="podium-week" aria-hidden="true">{_week_bars(d)}</span>
            </a>
        """
    return html

def _spot_viz(label, d):
    """A small visual that makes each spotlight self-explanatory."""
    if label == 'Most improved':
        before = d['flowers'] - (d['gain7'] or 0)
        top = max(d['flowers'], before, 1)
        return (f'<span class="spot-viz spot-bars"><span class="spot-bar"><i style="height:{before / top * 100:.0f}%"></i><b>{before}</b></span>'
                f'<span class="spot-arrow" aria-hidden="true">&rarr;</span>'
                f'<span class="spot-bar is-now"><i style="height:{d["flowers"] / top * 100:.0f}%"></i><b>{d["flowers"]}</b></span></span>')
    if label == 'Most consistent':
        dots = ''.join(f'<i class="{"on" if v is not None and v >= CONSISTENCY_LINE else ("off" if v is not None else "na")}"></i>' for v in d['series30'][-28:])
        return f'<span class="spot-viz spot-dots" aria-hidden="true">{dots}</span>'
    if label == 'Biggest climb':
        return (f'<span class="spot-viz spot-climb"><span class="spot-rank was">#{d["rank"] + d["rank_change"]}</span>'
                f'<span class="spot-chev" aria-hidden="true">&rsaquo;</span>'
                f'<span class="spot-rank now">#{d["rank"]}</span></span>')
    return ''

def generate_spotlights_html(data):
    items = ''
    for label, d, detail in pick_spotlights(data):
        avatar = f'<span class="spot-avatar"><img src="{escape(d["avatar"])}" alt="" class="spot-sprite"></span>' if d['avatar'] else '<span class="spot-avatar"></span>'
        items += f"""
                <a class="spot" href="users/user_{escape(d['id'])}.html">
                    {avatar}
                    <span class="spot-text"><span class="spot-label">{label}</span><span class="spot-name">{escape(d['name'])}</span><span class="spot-detail">{detail}</span></span>
                    {_spot_viz(label, d)}
                </a>"""
    return items

def generate_table_rows_html(data):
    """Rows of the standings table, with the consistency divider inserted."""
    html = ''
    top = data[0]['flowers'] if data else 0
    spark_max = max([v for d in data for v in d['series14'] if v is not None] + [CONSISTENCY_LINE])
    divider_done = False
    group_done = False
    inactive_total = sum(1 for d in data if d['flowers'] == 0)
    for d in data:
        if not group_done and d['flowers'] == 0 and inactive_total >= 3:
            html += f"""
                    <tr class="group-row"><td colspan="7"><button type="button" class="group-toggle" aria-expanded="false"><span class="group-count">{inactive_total}</span> trainers with no flowers this week <span class="group-arrow" aria-hidden="true">&#9662;</span></button></td></tr>"""
            group_done = True
        if not divider_done and d['flowers'] < CONSISTENCY_LINE:
            html += f"""
                    <tr class="line-row" aria-hidden="true"><td colspan="7"><span>{CONSISTENCY_LINE}-flower line</span></td></tr>"""
            divider_done = True

        pct = round((d['flowers'] / top) * 100, 1) if top > 0 else 0
        name = escape(d['name'])
        href = f"users/user_{escape(d['id'])}.html"
        classes = []
        if d['flowers'] == 0:
            classes.append('is-inactive')
        elif d['flowers'] < CONSISTENCY_LINE:
            classes.append('is-low')
        if d['rank'] <= 3:
            classes.append(f"is-top place-{d['rank']}")
        class_attr = f' class="{" ".join(classes)}"' if classes else ''

        if d['avatar']:
            avatar = f'<span class="avatar"><img src="{escape(d["avatar"])}" class="avatar-img" alt="" loading="lazy"></span>'
        else:
            avatar = f'<span class="avatar avatar-placeholder" aria-hidden="true">{escape(d["name"][:1].upper() or "?")}</span>'

        gain_sort = d['gain7'] if d['gain7'] is not None else -10**6
        change_sort = d['rank_change'] if d['rank_change'] is not None else -10**6
        html += f"""
                    <tr{class_attr} style="--i:{d['rank']}" data-id="{escape(d['id'])}" data-name="{name.lower()}" data-href="{href}" data-rank="{d['rank']}" data-flowers="{d['flowers']}" data-gain="{gain_sort}" data-change="{change_sort}">
                        <td class="col-rank"><span class="rank-num">{d['rank']}</span></td>
                        <td class="col-player">
                            <a class="player-link" href="{href}">
                                {avatar}
                                <span class="player-meta">
                                    <span class="player-name">{name}<span class="me-tag">you</span></span>
                                    <span class="player-title"><span class="role">{escape(d['title'])}</span><span class="hours-inline"> &middot; {format_hours(d['hours'])} h</span></span>
                                </span>
                            </a>
                        </td>
                        <td class="col-flowers">
                            <span class="num">{d['flowers']}</span>
                            <span class="bar" aria-hidden="true"><span class="bar-fill" style="width: {pct}%"></span></span>
                            <span class="m-chip">{gain_html(d['gain7'])} {rank_change_html(d['rank_change'])}</span>
                        </td>
                        <td class="col-trend">{sparkline_svg(d['series14'], spark_max)}</td>
                        <td class="col-gain">{gain_html(d['gain7'])}</td>
                        <td class="col-change">{rank_change_html(d['rank_change'])}</td>
                        <td class="col-me"><button type="button" class="me-btn" data-id="{escape(d['id'])}" aria-pressed="false" aria-label="Mark {name} as me" title="This is me">
                            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z"/></svg>
                        </button></td>
                    </tr>"""
    return html

# ---------------------------------------------------------------------------
# Trainer dashboards
# ---------------------------------------------------------------------------

def get_user_history(trainer_id):
    """Load all historical data for a given trainer from current and yearly files."""
    history = []
    try:
        with open('history_current.json', 'r') as f:
            current_data = json.load(f)
            history.extend(current_data.get(trainer_id, []))
    except (FileNotFoundError, json.JSONDecodeError):
        pass

    for filename in sorted(os.listdir('.')):
        if filename.startswith('history_') and filename.endswith('.json') and filename != 'history_current.json':
            try:
                with open(filename, 'r') as f:
                    history.extend(json.load(f).get(trainer_id, []))
            except (FileNotFoundError, json.JSONDecodeError):
                continue

    # Deduplicate by date (later entries win) and sort chronologically
    by_date = {}
    for entry in history:
        if 'date' in entry:
            by_date[entry['date']] = entry
    return [by_date[d] for d in sorted(by_date)]

def profile_flower_svg(d, max_flowers, idx, avatar=None):
    """A single flower at the trainer's real relative height for the profile header."""
    color = METAL_COLORS.get(d['rank']) or FLOWER_COLORS[idx % len(FLOWER_COLORS)]
    return (f'<svg class="profile-flower" viewBox="-60 0 120 260" width="120" height="260" aria-hidden="true">'
            f'<g transform="translate(0,252)">{_pixel_flower(d["flowers"], max_flowers, color, 900 + idx, avatar, None, d["flowers"] > 0)}</g></svg>')

def profile_line_offset(max_flowers):
    """Pixels above the grass where the 75 line sits in the trainer header (260px flower box)."""
    if max_flowers < CONSISTENCY_LINE:
        return None
    return 22 + (CONSISTENCY_LINE / max_flowers) * 208

def generate_user_dashboards(data):
    """Generate a dashboard page for each trainer."""
    try:
        with open('user_template.html', 'r', encoding='utf-8') as f:
            template = f.read()
    except FileNotFoundError:
        print("Error: user_template.html not found. Cannot generate dashboards.")
        return

    os.makedirs('users', exist_ok=True)
    total = len(data)
    max_flowers = data[0]['flowers'] if data else 0
    up = lambda p: ('../' + p) if p and not p.startswith('http') else p
    for idx, d in enumerate(data):
        user_history = get_user_history(d['id'])
        if not user_history:
            continue
        dates = [e['date'] for e in user_history]
        flowers = [e.get('flowers', 0) for e in user_history]
        ranks = [e.get('rank', 0) for e in user_history]

        page = template
        for key, value in {
            'display_name': escape(d['name']),
            'trainer_id': escape(d['id']),
            'title': escape(d['title']),
            'rank': str(d['rank']),
            'total_participants': str(total),
            'rank_change': rank_change_html(d['rank_change']),
            'gain': gain_html(d['gain7']),
            'trainer_avatar': _avatar_img(up(d['avatar']), 'trainer-avatar', d['name']),
            'focumon_avatar': _avatar_img(up(d['focumon']), 'focumon-avatar', 'Focumon partner'),
            'avatar_url': escape(up(d['avatar']) or ''),
            'flower_svg': profile_flower_svg(d, max_flowers, idx, up(d['avatar'])),
            'line_offset': f"{profile_line_offset(max_flowers) or 0:.0f}",
            'seed_bed': ''.join(f'<i style="left:{6 + (k * 37) % 88}%;--h:{14 + (k * 5) % 9}px"></i>' for k in range(14)),
            'above30': str(d['above30']),
            'days30': str(d['days30']),
            'dates': json.dumps(dates),
            'flowers': json.dumps(flowers),
            'ranks': json.dumps(ranks),
            'line': str(CONSISTENCY_LINE),
        }.items():
            page = page.replace('{{ ' + key + ' }}', value)

        with open(os.path.join('users', f"user_{d['id']}.html"), 'w', encoding='utf-8') as f:
            f.write(page)
        print(f"Generated dashboard for {d['name']} in users folder")

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    history = load_history()

    # Collect current data
    raw = []
    for url in urls:
        trainer_id = url.split('/')[-1].replace('.html', '')
        display_name, flowers, trainer_avatar, focumon_avatar = extract_flowers_name_and_avatars(url)
        hours_spent = round((flowers * 20) / 60, 2) if flowers else 0
        raw.append({'id': trainer_id, 'name': display_name, 'flowers': flowers, 'hours': hours_spent,
                    'avatar': trainer_avatar, 'focumon': focumon_avatar})
        print(f"Processed {display_name}: {flowers} flowers, {hours_spent} hours")

    for d in raw:
        d['avatar'] = localize_sprite(d['avatar'])
        d['focumon'] = localize_sprite(d['focumon'])

    raw.sort(key=lambda d: d['flowers'], reverse=True)
    current = {}
    for idx, d in enumerate(raw, start=1):
        d['rank'] = idx
        current[d['id']] = {'flowers': d['flowers'], 'rank': idx}

    history = update_history(history, current)

    data = []
    for d in raw:
        previous_rank = get_rank_change(history, d['id'])
        d['rank_change'] = None if previous_rank is None else previous_rank - d['rank']
        d['title'] = get_title(history.get(d['id'], []))
        d['series14'], d['series30'], d['gain7'], d['above30'], d['days30'] = compute_extras(history, d['id'], d['flowers'])
        data.append(d)

    save_history(history)
    generate_user_dashboards(data)

    total_flowers = sum(d['flowers'] for d in data)
    total_hours = round(sum((d['flowers'] * 20) / 60 for d in data), 2)
    above_line = sum(1 for d in data if d['flowers'] >= CONSISTENCY_LINE)
    max_flowers = data[0]['flowers'] if data else 0
    last_updated = datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC")

    with open('template.html', 'r', encoding='utf-8') as f:
        template = f.read()

    series = group_series(history)
    cd = community_delta(series)
    if cd is None:
        community_delta_html = '<span class="delta delta-muted">No comparison yet</span>'
    elif cd[0] > 0:
        community_delta_html = f'<span class="delta delta-up"><span class="delta-arrow" aria-hidden="true">&#9650;</span>+{cd[0]} ({cd[1]:+d}%) vs last week</span>'
    elif cd[0] < 0:
        community_delta_html = f'<span class="delta delta-down"><span class="delta-arrow" aria-hidden="true">&#9660;</span>&minus;{abs(cd[0])} ({cd[1]:+d}%) vs last week</span>'
    else:
        community_delta_html = '<span class="delta delta-flat">Same as last week</span>'

    page = template
    for key, value in {
        'garden': garden_svg(data, max_flowers),
        'trainer_json': trainer_json(data),
        'group_chart': group_chart_svg(series),
        'community_delta': community_delta_html,
        'community_start': str(next((v for v in series if v is not None), '')),
        'community_high': str(max(v for v in series if v is not None)) if any(v is not None for v in series) else '',
        'community_low': str(min(v for v in series if v is not None)) if any(v is not None for v in series) else '',
        'spotlights': generate_spotlights_html(data),
        'top_three': generate_top_three_html(data),
        'table_rows': generate_table_rows_html(data),
        'total_participants': str(len(data)),
        'total_flowers': str(total_flowers),
        'total_hours': format_hours(total_hours),
        'above_line': str(above_line),
        'line': str(CONSISTENCY_LINE),
        'last_updated': last_updated,
    }.items():
        page = page.replace('{{ ' + key + ' }}', value)

    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(page)
    print("Leaderboard HTML generated successfully!")

if __name__ == "__main__":
    main()

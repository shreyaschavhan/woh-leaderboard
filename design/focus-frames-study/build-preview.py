"""Freeze the current page for a design-only podium and focus comparison."""
from pathlib import Path
import hashlib
import json
import re
import subprocess
from PIL import Image

study = Path(__file__).resolve().parent
root = study.parent.parent
prefix = "design/focus-frames-study/"
sources = [
    "index.html", "style.css", "script.js", "focus.css", "community.css",
    "focus-layout.css", "focus.js", "focus-state.mjs", "community.js",
    "community-state.mjs", "focus-config.js",
]
hashes = {name: hashlib.sha256((root / name).read_bytes()).hexdigest() for name in sources}
manifest = study / "source-hashes.json"
if manifest.exists():
    previous = json.loads(manifest.read_text(encoding="utf-8"))
    if previous["files"] != hashes:
        raise SystemExit("Frozen baseline differs from this checkout. Keep the original comparison.")
baseline_commit = previous["commit"] if manifest.exists() else subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=root, text=True).strip()

for source, target in [
    ("style.css", "baseline.css"), ("focus.css", "baseline-focus.css"),
    ("community.css", "baseline-community.css"),
    ("focus-layout.css", "baseline-focus-layout.css"), ("script.js", "baseline.js"),
]:
    content = (root / source).read_text(encoding="utf-8")
    content = content.replace("url('assets/", "url('../../assets/")
    content = content.replace('url("assets/', 'url("../../assets/')
    (study / target).write_text(content, encoding="utf-8")

# Lower the original ES modules into separate classic-script scopes. This keeps
# the original rendering and interactions, and also works when opened as a file.
config = (root / "focus-config.js").read_text(encoding="utf-8").replace("export default", "const config =")
for component in ["focus", "community"]:
    state = (root / f"{component}-state.mjs").read_text(encoding="utf-8")
    state = re.sub(r"\bexport (?=(?:function|const)\b)", "", state)
    code = (root / f"{component}.js").read_text(encoding="utf-8")
    code = re.sub(r"^import .*?;\s*", "", code, flags=re.M)
    bundle = "// Frozen production behavior; only the data source is simulated.\n(() => {\n'use strict';\n"
    bundle += config + "\n" + state + "\n" + code + "\n})();\n"
    (study / f"{component}-preview.js").write_text(bundle, encoding="utf-8")

html = (root / "index.html").read_text(encoding="utf-8")
def ground_sprite(match):
    tag = match.group(0)
    source = re.search(r'src="([^"]+)"', tag)
    if not source or not (root / source[1]).is_file():
        return tag
    image = Image.open(root / source[1]).convert("RGBA")
    bounds = image.getchannel("A").getbbox()
    if not bounds:
        return tag
    shift = 100 * (image.height - bounds[3]) / image.height
    attrs = f' style="--sprite-ground-shift:{shift:.8f}%" data-alpha-bounds="{",".join(map(str, bounds))}"'
    return tag[:-1] + attrs + ">"
html = re.sub(r'<img\b[^>]*class="(?:trainer-avatar|focumon-avatar)"[^>]*>', ground_sprite, html)
html = html.replace('<html lang="en">', '<html lang="en" data-frame-view="after">', 1)
html = html.replace('<meta charset="UTF-8">', '<meta charset="UTF-8">\n    <base href="../../">', 1)
html = html.replace('<title>Consistency Leaderboard</title>', '<title>Podium and focus polish | Before / After</title>')
html = re.sub(r'\s*<!-- Google tag.*?</script>\s*<script>.*?</script>', '', html, flags=re.S)
for source, target in [
    ("style.css", "baseline.css"), ("focus.css", "baseline-focus.css"),
    ("community.css", "baseline-community.css"), ("focus-layout.css", "baseline-focus-layout.css"),
]:
    html = re.sub(rf'href="{re.escape(source)}(?:\?[^\"]*)?"', f'href="{prefix}{target}"', html)
html = html.replace('</head>', f'''    <link rel="stylesheet" href="{prefix}preview.css">
    <link rel="stylesheet" href="{prefix}concept.css" id="frame-concept-style">
    <script src="{prefix}sample-data.js"></script>
</head>''', 1)
toolbar = '''
    <aside class="frame-toolbar" aria-label="Design comparison">
      <div class="frame-toolbar-title"><strong>Podium &amp; focus polish</strong><small id="frame-caption">Artwork, spacing, and stepped frames.</small></div>
      <div class="frame-switch" role="group" aria-label="Compare card frames">
        <button type="button" id="frame-before" aria-pressed="false">Before</button>
        <button type="button" id="frame-after" aria-pressed="true">After</button>
      </div>
      <button type="button" id="frame-theme" aria-label="Change preview theme">Dark theme</button>
      <label class="frame-sample"><span>Sample sessions</span><select id="frame-sample">
        <option value="focus">Focusing</option><option value="choose">No trainer</option>
        <option value="break">On a break</option><option value="ready">Ready</option>
        <option value="quiet">Quiet guild</option><option value="offline">Offline</option>
      </select></label>
      <button type="button" id="frame-view-podium">View podium</button>
      <button type="button" id="frame-view-cards">View cards</button>
      <p class="sr-only" role="status" id="frame-announcement"></p>
    </aside>
'''
html = html.replace('<body class="home">', '<body class="home frame-study">' + toolbar, 1)
html = re.sub(r'<script src="script\.js[^\"]*"></script>', f'<script src="{prefix}baseline.js"></script>', html)
for component in ["focus", "community"]:
    html = re.sub(rf'<script type="module" src="{component}\.js[^\"]*"></script>',
                  f'<script src="{prefix}{component}-preview.js"></script>', html)
html = html.replace('</body>', f'    <script src="{prefix}preview.js"></script>\n</body>', 1)
(study / "index.html").write_text(html, encoding="utf-8")
manifest.write_text(json.dumps({
    "commit": baseline_commit,
    "files": hashes,
}, indent=2) + "\n", encoding="utf-8")
print("Created frozen full-page frame comparison; production files unchanged.")

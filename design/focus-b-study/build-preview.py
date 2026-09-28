"""Freeze the real homepage for a design-only Current / Concept comparison."""
from pathlib import Path
import hashlib
import json
import re

study = Path(__file__).resolve().parent
root = study.parent.parent
previous = root / "design" / "focus-balance-study"
prefix = "design/focus-b-study/"
sources = ["index.html", "style.css", "script.js", "focus.css", "community.css"]

for source, target in [("style.css", "page.css"), ("script.js", "page.js"),
                       ("focus.css", "current-focus.css"), ("community.css", "current-community.css")]:
    content = (root / source).read_text(encoding="utf-8")
    if source.endswith(".css"):
        content = content.replace("url('assets/", "url('../../assets/")
        content = content.replace('url("assets/', 'url("../../assets/')
    (study / target).write_text(content, encoding="utf-8")

html = (root / "index.html").read_text(encoding="utf-8")
html = html.replace('<html lang="en">', '<html lang="en" data-study-view="after">')
html = html.replace('<meta charset="UTF-8">', '<meta charset="UTF-8">\n    <base href="../../">', 1)
html = html.replace('<title>Consistency Leaderboard</title>', '<title>Focus B | Current / Concept</title>')
html = re.sub(r'    <!-- Google tag.*?</script>\s*<script>.*?</script>', '', html, flags=re.S)
html = re.sub(r'<link rel="stylesheet" href="(?:style|focus|community)\.css[^\"]*">', '', html)
styles = '\n'.join(f'    <link rel="stylesheet" href="{prefix}{name}">' for name in
                    ["page.css", "current-focus.css", "current-community.css", "preview.css"])
styles += f'\n    <link rel="stylesheet" href="{prefix}concept.css" data-study-style="after">\n'
html = html.replace('</head>', styles + '</head>')

# This extra group has no layout in Current. Concept composes both sections together.
html = html.replace('<section class="focus-section"', '<div class="focus-hub">\n        <section class="focus-section"', 1)
html = html.replace('<dialog id="guild-member-dialog"', '</div>\n\n<dialog id="guild-member-dialog"', 1)
html = html.replace('<div class="focus-copy">', '<div class="focus-copy">\n          <div class="focus-details">', 1)
html = html.replace('<div class="focus-actions">', '</div>\n          <div class="focus-actions">', 1)

old = (previous / "index.html").read_text(encoding="utf-8")
review = old[old.index('    <aside class="study-toolbar"'):old.index('    <script type="application/json"')]
review = review.replace('FOCUS, IN BALANCE', 'FOCUS / DIRECTION B')
review = review.replace('Smaller scenes. More room to breathe.', 'Small scenes, together in the page.')
review = review.replace('>Before</button>', '>Current</button>').replace('>After</button>', '>Concept B</button>')
html = re.sub(r'    <script(?: type="module")? src="(?:script|focus|community)\.js[^\"]*"></script>\n?', '', html)
scripts = '\n'.join(f'    <script src="{prefix}{name}"></script>' for name in
                    ["page.js", "guild-demo.js", "preview.js"])
html = html.replace('</body>', review + scripts + '\n</body>')
(study / "index.html").write_text(html, encoding="utf-8")

preview = (previous / "preview.js").read_text(encoding="utf-8")
preview = preview.replace("params.get('view') === 'before'", "['before', 'current'].includes(params.get('view'))")
preview = preview.replace("'Original scale and night palette.' : 'Smaller scenes. More room to breathe.'", "'Current panels, same sample sessions.' : 'Small scenes, together in the page.'")
preview = preview.replace("'Original' : 'Proposed'", "'Current' : 'Concept B'")
preview = preview.replace("url.searchParams.set('view', view);", "url.searchParams.set('view', view === 'before' ? 'current' : 'concept');")
preview = re.sub(r'  function keepContext\(change\) \{.*?\n  \}', '''  function keepContext(change) {
    const left = window.scrollX;
    const top = window.scrollY;
    change();
    window.scrollTo({ left, top, behavior: 'instant' });
  }''', preview, flags=re.S)
(study / "preview.js").write_text(preview, encoding="utf-8")

guild = (previous / "guild-demo.js").read_text(encoding="utf-8")
guild = guild.replace("'Focus time paused'", "'On a break · Focus time paused'")
(study / "guild-demo.js").write_text(guild, encoding="utf-8")
(study / "preview.css").write_text((previous / "preview.css").read_text(encoding="utf-8") + '\n.focus-hub { display: contents; }\n', encoding="utf-8")
(study / "source-hashes.json").write_text(json.dumps({name: hashlib.sha256((root / name).read_bytes()).hexdigest()
                                                      for name in sources}, indent=2) + '\n', encoding="utf-8")
print('Created design/focus-b-study: native full-page comparison, original assets, sample sessions.')

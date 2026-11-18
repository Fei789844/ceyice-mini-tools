from pathlib import Path
import sys,zipfile,hashlib,json
root=Path(__file__).resolve().parents[1]
slug=sys.argv[1]
if slug not in [p.name for p in (root/'projects').iterdir() if p.is_dir()]: raise SystemExit('Unknown project')
p=root/'projects'/slug
if not (p/'dist/index.html').is_file(): raise SystemExit('Missing index.html')
with zipfile.ZipFile(p/'release/tool.zip','w',zipfile.ZIP_DEFLATED) as z:
 for f in sorted((p/'dist').rglob('*')):
  if f.is_file() and not any(s.startswith('.') for s in f.relative_to(p/'dist').parts): z.write(f,f.relative_to(p/'dist'))
m=json.loads((root/'manifest.json').read_text())
for entry in m:
 if entry['project']==slug: entry['zip_sha256']=hashlib.sha256((p/'release/tool.zip').read_bytes()).hexdigest()
(root/'manifest.json').write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n')
print(p/'release/tool.zip')

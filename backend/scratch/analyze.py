import glob
import re
import sys
from pathlib import Path
from pypdf import PdfReader

sys.stdout.reconfigure(encoding='utf-8')

root = Path(__file__).resolve().parent.parent

for f in sorted(root.glob("*/*.pdf")):
    r = PdfReader(str(f))
    print(f"\n========================================")
    print(f"FILE: {f.relative_to(root)}")
    print(f"========================================")
    for p_idx, page in enumerate(r.pages, start=1):
        lines = page.extract_text().splitlines()
        print(f"--- Page {p_idx} ---")
        for line in lines:
            line_str = line.strip()
            if not line_str:
                continue
            print(f"  {line_str}")

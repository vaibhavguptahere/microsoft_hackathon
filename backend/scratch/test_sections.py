import glob
import re
import sys
from pathlib import Path
from pypdf import PdfReader

sys.stdout.reconfigure(encoding='utf-8')

root = Path(__file__).resolve().parent.parent

def is_section_heading(line):
    line = line.strip()
    if not line:
        return False
    if 'Beacon Technologies' in line or 'Internal Use Only' in line or 'Page ' in line or 'Synthetic document' in line:
        return False
    if line in ['Field', 'Details', 'Document ID', 'Version', 'Effective Date', 'Policy Owner', 'Department', 'Approved By', 'Next Review']:
        return False

    if re.match(r'^\d+\.\d+\s+[A-Z]', line) and not line.endswith('.') and len(line) < 80:
        return True

    if re.match(r'^\d+\.\s+[A-Z]', line) and not line.endswith('.') and len(line) < 70:
        title = re.sub(r'^\d+\.\s+', '', line).strip()
        if re.match(r'^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}$', title):
            return False
        return True

    if re.match(r'^BT-[A-Z]+-\d{3}\s+.*Policy$', line):
        return True

    return False

for f in sorted(root.glob("*/*.pdf")):
    r = PdfReader(str(f))
    print(f"\n========================================")
    print(f"FILE: {f.relative_to(root)}")
    for p_idx, page in enumerate(r.pages, start=1):
        text = page.extract_text()
        lines = text.splitlines()
        curr_sec = "General"
        curr_lines = []
        for line in lines:
            line_str = line.strip()
            if not line_str:
                continue
            if is_section_heading(line_str):
                if curr_lines:
                    sec_text = "\n".join(curr_lines)
                    print(f"  [P{p_idx}] Section: '{curr_sec}' | Length: {len(sec_text)} chars")
                curr_sec = line_str
                curr_lines = []
            else:
                curr_lines.append(line_str)
        if curr_lines:
            sec_text = "\n".join(curr_lines)
            print(f"  [P{p_idx}] Section: '{curr_sec}' | Length: {len(sec_text)} chars")

import re
from pathlib import Path
from pypdf import PdfReader

root = Path(__file__).resolve().parent.parent
faq_path = root / "HR" / "BT-HR-FAQ-001 HR Frequently Asked Questions.pdf"

def is_header_footer(line):
    line = line.strip()
    if not line:
        return True
    if "Beacon Technologies" in line or "Internal Use Only" in line or "Synthetic document" in line:
        return True
    if re.match(r"^Page \d+$", line):
        return True
    return False

def is_section_heading(line):
    line = line.strip()
    if not line:
        return False
    if is_header_footer(line):
        return False
    if line in ["Field", "Details", "Document ID", "Version", "Effective Date", "Policy Owner", "Department", "Approved By", "Next Review"]:
        return False

    if re.match(r"^\d+\.\d+\s+[A-Z]", line) and not line.endswith(".") and len(line) < 80:
        return True

    if re.match(r"^\d+\.\s+[A-Z]", line) and not line.endswith(".") and len(line) < 70:
        title = re.sub(r"^\d+\.\s+", "", line).strip()
        if re.match(r"^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}$", title):
            return False
        return True

    if re.match(r"^BT-[A-Z]+-(FAQ-)?\d{3}\s+.*Policy$", line):
        return True

    return False

reader = PdfReader(str(faq_path))
current_section = "General"
doc_sections = []
current_lines = []
current_page = 1

for p_idx, page in enumerate(reader.pages, start=1):
    lines = page.extract_text().splitlines()
    for line in lines:
        line_str = line.strip()
        if is_header_footer(line_str):
            continue
        if line_str in ["Field", "Details", "Document ID", "Version", "Effective Date", "Policy Owner", "Department", "Approved By", "Next Review"]:
            continue

        if is_section_heading(line_str):
            if current_lines:
                doc_sections.append({
                    "section": current_section,
                    "text": "\n".join(current_lines),
                    "page": current_page
                })
            current_section = line_str
            current_lines = []
            current_page = p_idx
        else:
            current_lines.append(line_str)

if current_lines:
    doc_sections.append({
        "section": current_section,
        "text": "\n".join(current_lines),
        "page": current_page
    })

print(f"Extracted {len(doc_sections)} sections from BT-HR-FAQ-001:")
for idx, sec in enumerate(doc_sections, 1):
    print(f"\nSection {idx}: [{sec['section']}] (Page {sec['page']}) | Length: {len(sec['text'])} chars")
    print("-" * 50)
    print(sec["text"][:300] + "...")

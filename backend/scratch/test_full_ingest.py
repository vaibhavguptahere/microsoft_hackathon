import re
import glob
from pathlib import Path
from pypdf import PdfReader

root = Path(__file__).resolve().parent.parent

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

    # Sub-section heading: 4.1 Annual Leave, 5.1 Booking Travel, 3.1 Issue and Refresh
    if re.match(r"^\d+\.\d+\s+[A-Z]", line) and not line.endswith(".") and len(line) < 80:
        return True

    # Top-level section heading: 1. Purpose, 2. Scope, 3. Leave Entitlements, 4. Main Rules, 5. Exceptions
    if re.match(r"^\d+\.\s+[A-Z]", line) and not line.endswith(".") and len(line) < 70:
        title = re.sub(r"^\d+\.\s+", "", line).strip()
        if re.match(r"^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}$", title):
            return False
        return True

    # FAQ policy sub-heading: BT-HR-001 Employee Leave Policy
    if re.match(r"^BT-[A-Z]+-(FAQ-)?\d{3}\s+.*Policy$", line):
        return True

    return False

def chunk_section_text(section_name, text, max_chunk_size=1000):
    """
    If text <= max_chunk_size, return as single chunk.
    Otherwise split by logical paragraphs / sentences while preserving complete sentences.
    """
    text = text.strip()
    if not text:
        return []

    if len(text) <= max_chunk_size:
        return [text]

    # Split by double newlines or lines starting with bullet/number or Q
    blocks = re.split(r'\n(?=(?:Q\d+\.|\d+\.|\*|\-|\u2022)\s+)', text)
    chunks = []
    current_chunk = []
    current_length = 0

    for block in blocks:
        block = block.strip()
        if not block:
            continue
        if current_length + len(block) + 1 > max_chunk_size and current_chunk:
            chunks.append("\n".join(current_chunk))
            current_chunk = [block]
            current_length = len(block)
        else:
            current_chunk.append(block)
            current_length += len(block) + 1

    if current_chunk:
        chunks.append("\n".join(current_chunk))

    return chunks

def process_pdf(pdf_path):
    department = pdf_path.parent.name
    document_name = pdf_path.name
    document_type = "FAQ" if "FAQ" in document_name.upper() else "Policy"
    source = pdf_path.relative_to(root).as_posix()

    reader = PdfReader(str(pdf_path))
    current_section = "General"
    doc_sections = []
    current_lines = []
    current_page = 1

    for p_idx, page in enumerate(reader.pages, start=1):
        text = page.extract_text()
        if not text:
            continue
        lines = text.splitlines()
        for line in lines:
            line_str = line.strip()
            if is_header_footer(line_str):
                continue
            if line_str in ["Field", "Details", "Document ID", "Version", "Effective Date", "Policy Owner", "Department", "Approved By", "Next Review"]:
                continue

            if is_section_heading(line_str):
                if current_lines:
                    sec_text = "\n".join(current_lines).strip()
                    if sec_text:
                        doc_sections.append({
                            "section": current_section,
                            "text": sec_text,
                            "page": current_page
                        })
                current_section = line_str
                current_lines = []
                current_page = p_idx
            else:
                current_lines.append(line_str)

    if current_lines:
        sec_text = "\n".join(current_lines).strip()
        if sec_text:
            doc_sections.append({
                "section": current_section,
                "text": sec_text,
                "page": current_page
            })

    chunks = []
    chunk_counter = 1
    for sec_info in doc_sections:
        sec_name = sec_info["section"]
        sec_text = sec_info["text"]
        page_num = sec_info["page"]

        sub_chunks = chunk_section_text(sec_name, sec_text, max_chunk_size=1000)
        for sub_c in sub_chunks:
            # Prefix section header context if not already present
            content_str = f"Section: {sec_name}\n{sub_c}" if not sub_c.startswith("Section:") else sub_c
            chunks.append({
                "content": content_str,
                "department": department,
                "document_name": document_name,
                "document_type": document_type,
                "section": sec_name,
                "page": page_num,
                "source": source,
                "chunk_number": chunk_counter
            })
            chunk_counter += 1

    return chunks

all_chunks = []
for pdf in sorted(root.glob("*/*.pdf")):
    c = process_pdf(pdf)
    all_chunks.extend(c)

print(f"Total PDF files: 18")
print(f"Total generated chunks across all 18 files: {len(all_chunks)}")

# Print sample sections and chunk details
sections_summary = {}
for chunk in all_chunks:
    sec = chunk["section"]
    doc = chunk["document_name"]
    key = f"{doc} -> {sec}"
    sections_summary[key] = sections_summary.get(key, 0) + 1

print("\nSample chunk sections extracted:")
for k, count in list(sections_summary.items())[:20]:
    print(f"  {k}: {count} chunk(s)")

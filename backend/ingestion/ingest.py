import os
import re
import hashlib
from pathlib import Path

from dotenv import load_dotenv
from pypdf import PdfReader
from openai import AzureOpenAI
from azure.search.documents import SearchClient
from azure.core.credentials import AzureKeyCredential


# ============================================================
# 1. LOAD ENVIRONMENT VARIABLES
# ============================================================

load_dotenv()

SEARCH_ENDPOINT = os.getenv("AZURE_SEARCH_ENDPOINT")
SEARCH_KEY = os.getenv("AZURE_SEARCH_KEY")
SEARCH_INDEX = os.getenv("AZURE_SEARCH_INDEX")

OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
OPENAI_KEY = os.getenv("AZURE_OPENAI_API_KEY")
EMBEDDING_DEPLOYMENT = os.getenv(
    "AZURE_OPENAI_EMBEDDING_DEPLOYMENT"
)

# Project root:
# Beacon Technologies Pvt. Ltd/
ROOT_DIR = Path(__file__).resolve().parent.parent


# ============================================================
# 2. CREATE AZURE CLIENTS
# ============================================================

embedding_client = AzureOpenAI(
    api_key=OPENAI_KEY,
    azure_endpoint=OPENAI_ENDPOINT,
    api_version="2024-10-21"
)

search_client = SearchClient(
    endpoint=SEARCH_ENDPOINT,
    index_name=SEARCH_INDEX,
    credential=AzureKeyCredential(SEARCH_KEY)
)


# ============================================================
# 3. SETTINGS
# ============================================================

MAX_CHUNK_SIZE = 1000

EMBEDDING_BATCH_SIZE = 16
UPLOAD_BATCH_SIZE = 50


# ============================================================
# 4. TEXT CLEANING & NOISE FILTERING
# ============================================================

def clean_text(text):
    """Clean extracted PDF text."""
    if not text:
        return ""
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n\s*\n+", "\n\n", text)
    return text.strip()


def is_header_footer_or_noise(line):
    """Check if a line is a document header, footer, or noise line."""
    line = line.strip()
    if not line:
        return True
    if "Beacon Technologies" in line or "Internal Use Only" in line or "Synthetic document" in line:
        return True
    if re.match(r"^Page \d+$", line, re.IGNORECASE):
        return True
    if line in [
        "Field", "Details", "Document ID", "Version", "Effective Date",
        "Policy Owner", "Department", "Approved By", "Next Review"
    ]:
        return True
    return False


# ============================================================
# 5. ACCURATE SECTION HEADING DETECTION
# ============================================================

def is_section_heading(line):
    """
    Detect actual section headings, avoiding false positives from list items or sentences.

    Examples of valid headings:
    - 1. Purpose
    - 2. Scope
    - 3. Leave Entitlements
    - 4. Main Rules
    - 4.1 Annual Leave
    - 4.2 Applying for Leave
    - 5. Exceptions
    - BT-HR-001 Employee Leave Policy
    - 4. Questions That Involve More Than One Department
    """
    line = line.strip()
    if not line or is_header_footer_or_noise(line):
        return False

    # 1. Sub-section headings like "4.1 Annual Leave", "5.1 Booking Travel", "3.1 Issue and Refresh"
    if re.match(r"^\d+\.\d+\s+[A-Z]", line) and not line.endswith(".") and len(line) < 80:
        return True

    # 2. Top-level section headings like "1. Purpose", "2. Scope", "3. Leave Entitlements", "4. Main Rules", "5. Exceptions"
    if re.match(r"^\d+\.\s+[A-Z]", line) and not line.endswith(".") and len(line) < 70:
        title = re.sub(r"^\d+\.\s+", "", line).strip()
        # Reject date strings like "1 January 2026"
        if re.match(r"^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}$", title):
            return False
        return True

    # 3. FAQ Policy sub-headers like "BT-HR-001 Employee Leave Policy"
    if re.match(r"^BT-[A-Z]+-(FAQ-)?\d{3}\s+.*Policy$", line):
        return True

    return False


# ============================================================
# 6. SEMANTIC / SECTION-AWARE CHUNKING
# ============================================================

def chunk_section_text(section_name, text, max_chunk_size=MAX_CHUNK_SIZE):
    """
    Split section text into semantic chunks without breaking sentences or key rules.
    If the section text fits within max_chunk_size, return it as a single chunk.
    """
    text = text.strip()
    if not text:
        return []

    if len(text) <= max_chunk_size:
        return [text]

    # Split on logical block boundaries (numbered items, bullet points, Q&A entries, or double newlines)
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


# ============================================================
# 7. CREATE EMBEDDINGS
# ============================================================

def create_embeddings(texts):
    """Generate embeddings using text-embedding-3-small."""
    response = embedding_client.embeddings.create(
        model=EMBEDDING_DEPLOYMENT,
        input=texts
    )
    data = sorted(response.data, key=lambda x: x.index)
    return [item.embedding for item in data]


# ============================================================
# 8. CREATE SAFE AZURE SEARCH DOCUMENT ID
# ============================================================

def create_document_id(source, page, chunk_number):
    """Create a stable unique ID for every chunk."""
    raw_id = f"{source}_{page}_{chunk_number}"
    return hashlib.md5(raw_id.encode("utf-8")).hexdigest()


# ============================================================
# 9. PROCESS ONE PDF
# ============================================================

def process_pdf(pdf_path):
    print(f"\nProcessing: {pdf_path.relative_to(ROOT_DIR)}")

    department = pdf_path.parent.name
    document_name = pdf_path.name
    document_type = "FAQ" if "FAQ" in document_name.upper() else "Policy"
    source = pdf_path.relative_to(ROOT_DIR).as_posix()

    reader = PdfReader(str(pdf_path))

    # Extract document-wide text while tracking sections across page boundaries
    current_section = "General"
    doc_sections = []
    current_lines = []
    current_page = 1

    for page_number, page in enumerate(reader.pages, start=1):
        text = page.extract_text()
        if not text:
            continue

        lines = text.splitlines()
        for line in lines:
            line_str = line.strip()

            if is_header_footer_or_noise(line_str):
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
                current_page = page_number
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

    # Build final chunk list
    all_chunks = []
    chunk_counter = 1

    for sec_info in doc_sections:
        sec_name = sec_info["section"]
        sec_text = sec_info["text"]
        page_num = sec_info["page"]

        sub_chunks = chunk_section_text(sec_name, sec_text, max_chunk_size=MAX_CHUNK_SIZE)

        for sub_c in sub_chunks:
            # Include explicit section title in chunk content for stronger search context
            content_text = f"Section: {sec_name}\n{sub_c}"

            all_chunks.append({
                "content": content_text,
                "department": department,
                "document_name": document_name,
                "document_type": document_type,
                "section": sec_name,
                "page": page_num,
                "source": source,
                "chunk_number": chunk_counter
            })
            chunk_counter += 1

    print(f"  Pages: {len(reader.pages)} | Sections: {len(doc_sections)} | Chunks: {len(all_chunks)}")
    return all_chunks


# ============================================================
# 10. FIND ALL PDFs
# ============================================================

def get_all_pdfs():
    pdfs = []
    departments = ["HR", "IT", "Finance"]

    for department in departments:
        department_dir = ROOT_DIR / department
        if not department_dir.exists():
            print(f"WARNING: {department_dir} does not exist")
            continue
        pdfs.extend(department_dir.glob("*.pdf"))

    return sorted(pdfs)


# ============================================================
# 11. GENERATE EMBEDDINGS
# ============================================================

def embed_documents(documents):
    total = len(documents)

    for start in range(0, total, EMBEDDING_BATCH_SIZE):
        batch = documents[start:start + EMBEDDING_BATCH_SIZE]
        texts = [item["content"] for item in batch]

        print(f"Generating embeddings {start + 1} - {start + len(batch)} of {total}")
        embeddings = create_embeddings(texts)

        for item, embedding in zip(batch, embeddings):
            item["contentVector"] = embedding
            item["id"] = create_document_id(
                item["source"],
                item["page"],
                item["chunk_number"]
            )
            del item["chunk_number"]


# ============================================================
# 12. CLEAR AZURE AI SEARCH INDEX DOCUMENTS
# ============================================================

def clear_index():
    """
    Delete all existing documents from the index without deleting/recreating the index schema.
    """
    print(f"\nClearing all existing documents from index '{SEARCH_INDEX}'...")
    results = search_client.search(search_text="*", select=["id"])
    doc_ids = [{"id": r["id"]} for r in results]

    if doc_ids:
        print(f"Deleting {len(doc_ids)} existing document(s)...")
        for start in range(0, len(doc_ids), UPLOAD_BATCH_SIZE):
            batch = doc_ids[start:start + UPLOAD_BATCH_SIZE]
            search_client.delete_documents(documents=batch)
        print("Index documents cleared successfully.")
    else:
        print("Index is already empty.")


# ============================================================
# 13. UPLOAD TO AZURE AI SEARCH
# ============================================================

def upload_documents(documents):
    total = len(documents)
    print("\nUploading documents to Azure AI Search...")

    for start in range(0, total, UPLOAD_BATCH_SIZE):
        batch = documents[start:start + UPLOAD_BATCH_SIZE]
        print(f"Uploading {start + 1} - {start + len(batch)} of {total}")

        results = search_client.upload_documents(documents=batch)
        failed = [r for r in results if not r.succeeded]

        if failed:
            print(f"WARNING: {len(failed)} documents failed.")
            for failure in failed:
                print("ID:", failure.key, "Error:", failure.error_message)


# ============================================================
# 14. MAIN
# ============================================================

def main():
    import argparse

    parser = argparse.ArgumentParser(description="Ingest Beacon Technologies PDFs into Azure AI Search.")
    parser.add_argument(
        "--clear",
        action="store_true",
        help="Delete all existing documents from the index before ingestion."
    )
    args = parser.parse_args()

    print("=" * 60)
    print("BEACON TECHNOLOGIES - RAG INGESTION")
    print("=" * 60)

    if args.clear:
        clear_index()

    pdf_files = get_all_pdfs()
    print(f"\nFound {len(pdf_files)} PDF files.")

    if not pdf_files:
        print("No PDFs found.")
        return

    all_documents = []
    for pdf_path in pdf_files:
        chunks = process_pdf(pdf_path)
        all_documents.extend(chunks)

    print("\n" + "=" * 60)
    print(f"TOTAL CHUNKS: {len(all_documents)}")
    print("=" * 60)

    embed_documents(all_documents)
    upload_documents(all_documents)

    print("\n" + "=" * 60)
    print("INGESTION COMPLETE!")
    print("=" * 60)
    print(f"PDFs processed: {len(pdf_files)}")
    print(f"Chunks uploaded: {len(all_documents)}")
    print(f"Index: {SEARCH_INDEX}")


if __name__ == "__main__":
    main()
import os

from dotenv import load_dotenv
from openai import AzureOpenAI


# ============================================================
# LOAD ENVIRONMENT
# ============================================================

load_dotenv()

OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
OPENAI_KEY = os.getenv("AZURE_OPENAI_API_KEY")
CHAT_DEPLOYMENT = os.getenv("AZURE_OPENAI_CHAT_DEPLOYMENT")


# ============================================================
# CLIENT
# ============================================================

chat_client = AzureOpenAI(
    api_key=OPENAI_KEY,
    azure_endpoint=OPENAI_ENDPOINT,
    api_version="2024-10-21"
)


# ============================================================
# SYSTEM PROMPT
# ============================================================

SYSTEM_PROMPT = """You are a helpful HR/IT/Finance policy assistant for Beacon Technologies Pvt. Ltd.

Answer ONLY using the information provided in the retrieved context below.
Do NOT invent, assume, or infer any information that is not explicitly stated in the context.
If the context does not contain the answer, respond with:
"I'm sorry, the information you requested is not available in the provided documents."

Rules:
- Be concise and natural. Avoid bullet-point overload unless listing items is genuinely clearer.
- Cite the source document name and page number in parentheses after each claim, e.g. (BT-HR-001 Employee Leave Policy, Page 2).
- If multiple sources support the same claim, cite all of them.
- Do not reference the context passages directly — write as if answering naturally.
"""


# ============================================================
# GENERATE ANSWER
# ============================================================

def generate_answer(query: str, retrieved_chunks: list[dict]) -> dict:
    """
    Generate a grounded answer from gpt-4.1-mini using retrieved context chunks.

    Args:
        query: The user's question.
        retrieved_chunks: List of dicts from search_documents(), each with
                          keys: content, document_name, page, section, score.

    Returns:
        {
            "answer": str,
            "sources": [{"document": str, "page": int}, ...]
        }
    """
    if not retrieved_chunks:
        return {
            "answer": "I'm sorry, no relevant documents were found to answer your question.",
            "sources": []
        }

    # Build context block
    context_parts = []
    for i, chunk in enumerate(retrieved_chunks, start=1):
        context_parts.append(
            f"[Source {i}]\n"
            f"Document: {chunk['document_name']}\n"
            f"Page: {chunk['page']}\n"
            f"Section: {chunk['section']}\n"
            f"Content:\n{chunk['content']}"
        )
    context_text = "\n\n---\n\n".join(context_parts)

    user_message = (
        f"Context:\n\n{context_text}\n\n"
        f"---\n\n"
        f"Question: {query}"
    )

    response = chat_client.chat.completions.create(
        model=CHAT_DEPLOYMENT,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message}
        ],
        temperature=0.0,
        max_tokens=600
    )

    answer = response.choices[0].message.content.strip()

    # Deduplicate sources preserving order
    seen = set()
    sources = []
    for chunk in retrieved_chunks:
        key = (chunk["document_name"], chunk["page"])
        if key not in seen:
            seen.add(key)
            sources.append({
                "document": chunk["document_name"],
                "page": chunk["page"]
            })

    return {
        "answer": answer,
        "sources": sources
    }

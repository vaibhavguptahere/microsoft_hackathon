"""
RAG Pipeline — ties together retrieval (search.py) and generation (generator.py).

Usage:
    from rag.pipeline import ask

    result = ask("How many unused annual leave days can be carried forward?", department="HR")
    print(result["answer"])
    print(result["sources"])
"""

import json
import sys

from app.rag.search import search_documents
from app.rag.generator import generate_answer


# ============================================================
# PIPELINE
# ============================================================

def ask(query: str, department: str = None, top_k: int = 5) -> dict:
    """
    Full RAG pipeline: retrieve → generate.

    Args:
        query:      The user's natural-language question.
        department: Optional department filter ("HR", "IT", "Finance").
        top_k:      Number of top chunks to retrieve (default 5).

    Returns:
        {
            "answer": str,
            "sources": [{"document": str, "page": int}, ...]
        }
    """
    # 1. Retrieve relevant chunks
    chunks = search_documents(query, department=department, top_k=top_k)

    # 2. Generate grounded answer
    result = generate_answer(query, chunks)

    return result




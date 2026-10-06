import os

from dotenv import load_dotenv
from openai import AzureOpenAI
from azure.search.documents import SearchClient
from azure.search.documents.models import VectorizedQuery
from azure.core.credentials import AzureKeyCredential


# ============================================================
# LOAD ENVIRONMENT
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


# ============================================================
# CLIENTS
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
# CREATE QUERY EMBEDDING
# ============================================================

def create_query_embedding(query):
    response = embedding_client.embeddings.create(
        model=EMBEDDING_DEPLOYMENT,
        input=query
    )
    return response.data[0].embedding


# ============================================================
# HYBRID SEARCH
# ============================================================

def search_documents(query, department=None, top_k=5):
    """
    Perform hybrid search combining BM25 keyword search and vector search
    with RRF ranking and optional department filtering.
    """
    # Create vector for the user's question
    query_vector = create_query_embedding(query)

    # Use a larger candidate pool for vector search (k=50) to allow strong RRF fusion
    vector_query = VectorizedQuery(
        vector=query_vector,
        k_nearest_neighbors=max(50, top_k * 5),
        fields="contentVector"
    )

    # Department filter expression
    filter_expression = None
    if department:
        filter_expression = f"department eq '{department}'"

    # Hybrid search with candidate pool retrieval
    candidate_limit = max(20, top_k * 3)

    results = search_client.search(
        search_text=query,
        vector_queries=[vector_query],
        filter=filter_expression,
        top=candidate_limit,
        select=[
            "content",
            "department",
            "document_name",
            "document_type",
            "section",
            "page",
            "source"
        ]
    )

    documents = []
    for result in results:
        documents.append({
            "content": result["content"],
            "department": result["department"],
            "document_name": result["document_name"],
            "document_type": result["document_type"],
            "section": result["section"],
            "page": result["page"],
            "source": result["source"],
            "score": result["@search.score"]
        })

    # Return top_k results
    return documents[:top_k]



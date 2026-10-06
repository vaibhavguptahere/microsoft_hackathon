from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import logging
from app.orchestration.classifier import classify_query
from app.orchestration.router import route_classification
from app.db.database import supabase as global_supabase, url, key
from supabase import create_client, ClientOptions

logger = logging.getLogger(__name__)

router = APIRouter()

class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    session_id: Optional[str] = None

@router.get("/chat/sessions")
async def get_sessions(authorization: Optional[str] = Header(None)):
    db_client = create_client(url, key)
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        db_client.postgrest.auth(token)
    
    if not db_client:
        return {"sessions": []}
    try:
        resp = db_client.table("chats").select("*").order("created_at", desc=True).execute()
        return {"sessions": resp.data}
    except Exception as e:
        logger.error(f"Error fetching sessions: {e}")
        return {"sessions": []}

@router.get("/chat/sessions/{session_id}")
async def get_session_messages(session_id: str, authorization: Optional[str] = Header(None)):
    db_client = create_client(url, key)
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        db_client.postgrest.auth(token)

    if not db_client:
        return {"messages": []}
    try:
        resp = db_client.table("messages").select("*").eq("chat_id", session_id).order("created_at", desc=False).execute()
        return {"messages": resp.data}
    except Exception as e:
        logger.error(f"Error fetching messages: {e}")
        return {"messages": []}

@router.post("/chat")
async def chat_endpoint(request: ChatRequest, authorization: Optional[str] = Header(None)):
    try:
        logger.info(f"Received chat message: {request.message}")

        db_client = create_client(url, key) if url and key else None
        
        # 1. Check Authentication
        user_id = None
        auth_error = None
        if db_client and authorization and authorization.startswith("Bearer "):
            token = authorization.split(" ")[1]
            try:
                user_resp = db_client.auth.get_user(token)
                if user_resp and user_resp.user:
                    user_id = user_resp.user.id
            except Exception as e:
                auth_error = str(e)
                logger.error(f"Auth verification failed: {e}")
        
        if not user_id:
            return {
                "success": False,
                "error": f"You must be signed in to ask a message. {auth_error if auth_error else ''}",
                "requires_login": True
            }

        # 2. Classify the query
        classification = await classify_query(request.message)
        logger.info(f"Classification result: {classification.status}")

        # 3. Route based on classification
        routing = route_classification(classification)

        # 4. Simulate Azure RAG response since no Azure RAG logic exists
        if routing.get("action") == "out_of_scope":
            return {
                "success": True,
                "domain": "0",
                "answer": routing.get("message", "I cannot help with that query."),
                "sources": []
            }
        
        elif routing.get("action") == "ask_clarification":
            return {
                "success": True,
                "domain": "0",
                "answer": routing.get("message", "Please clarify your query."),
                "sources": []
            }

        elif routing.get("action") == "route_to_domains":
            domains = [r["domain"] for r in routing.get("routes", [])]
            primary_domain = domains[0] if domains else "UNKNOWN"
            
            try:
                # Call actual Azure RAG logic
                from app.rag.pipeline import ask
                rag_result = ask(request.message, department=primary_domain)
                
                return {
                    "success": True,
                    "domain": primary_domain,
                    "answer": rag_result.get("answer", "No answer could be generated."),
                    "sources": [
                        {"title": f"{src.get('document', 'Document')} (Page {src.get('page', 'unknown')})", "url": "#"} 
                        for src in rag_result.get("sources", [])
                    ]
                }
            except Exception as e:
                logger.error(f"Error calling Azure RAG pipeline: {e}")
                return {
                    "success": False,
                    "domain": primary_domain,
                    "answer": "An error occurred while fetching information from our knowledge base.",
                    "sources": []
                }

        return {
            "success": False,
            "error": "Unable to process your request right now."
        }

    except Exception as e:
        logger.exception("Error processing chat request")
        return {
            "success": False,
            "error": str(e)
        }

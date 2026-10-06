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

        db_client = create_client(url, key)
        if authorization and authorization.startswith("Bearer "):
            token = authorization.split(" ")[1]
            db_client.postgrest.auth(token)

        # Ensure session exists or create one
        session_id = request.session_id
        if db_client:
            try:
                if not session_id:
                    # Generate a title from the first message
                    title = request.message[:50] + "..." if len(request.message) > 50 else request.message
                    session_resp = db_client.table("chats").insert({"title": title}).execute()
                    if session_resp.data:
                        session_id = session_resp.data[0]["id"]
                
                if session_id:
                    # Save user message
                    db_client.table("messages").insert({
                        "chat_id": session_id,
                        "role": "user",
                        "content": request.message,
                        "evidence": [],
                        "confidence": 0,
                        "agents": []
                    }).execute()
            except Exception as e:
                logger.error(f"Database error saving user message: {e}")

        # 1. Classify the query
        classification = await classify_query(request.message)
        logger.info(f"Classification result: {classification.status}")

        # 2. Route based on classification
        routing = route_classification(classification)

        def save_bot_message(response_data):
            if db_client and session_id:
                try:
                    db_client.table("messages").insert({
                        "chat_id": session_id,
                        "role": "nexus",
                        "content": response_data.get("answer", ""),
                        "evidence": response_data.get("sources", []),
                        "confidence": response_data.get("confidence", 90),
                        "agents": response_data.get("agents", [])
                    }).execute()
                except Exception as e:
                    logger.error(f"Failed to save bot message: {e}")

        def check_auth_and_return(res):
            is_logged_in = False
            if db_client and authorization and authorization.startswith("Bearer "):
                token = authorization.split(" ")[1]
                try:
                    user_resp = db_client.auth.get_user(token)
                    if user_resp and user_resp.user:
                        is_logged_in = True
                except Exception as e:
                    logger.error(f"Auth verification failed: {e}")
            
            if not is_logged_in:
                res["answer"] = "Please login to continue."
                res["sources"] = []
                res["requires_login"] = True

            save_bot_message(res)
            return res

        # 3. Simulate Azure RAG response since no Azure RAG logic exists
        if routing.get("action") == "out_of_scope":
            res = {
                "success": True,
                "domain": "0",
                "answer": routing.get("message", "I cannot help with that query."),
                "sources": [],
                "session_id": session_id
            }
            return check_auth_and_return(res)
        
        elif routing.get("action") == "ask_clarification":
            res = {
                "success": True,
                "domain": "0",
                "answer": routing.get("message", "Please clarify your query."),
                "sources": [],
                "session_id": session_id
            }
            return check_auth_and_return(res)

        elif routing.get("action") == "route_to_domains":
            domains = [r["domain"] for r in routing.get("routes", [])]
            primary_domain = domains[0] if domains else "UNKNOWN"
            
            try:
                # Call actual Azure RAG logic
                from app.rag.pipeline import ask
                rag_result = ask(request.message, department=primary_domain)
                
                res = {
                    "success": True,
                    "domain": primary_domain,
                    "answer": rag_result.get("answer", "No answer could be generated."),
                    "sources": [
                        {"title": f"{src.get('document', 'Document')} (Page {src.get('page', 'unknown')})", "url": "#"} 
                        for src in rag_result.get("sources", [])
                    ],
                    "session_id": session_id
                }
            except Exception as e:
                logger.error(f"Error calling Azure RAG pipeline: {e}")
                res = {
                    "success": False,
                    "domain": primary_domain,
                    "answer": "An error occurred while fetching information from our knowledge base.",
                    "sources": [],
                    "session_id": session_id
                }
                
            return check_auth_and_return(res)

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

# Nexus Directory Guide

## `frontend/`

The user-facing layer of Nexus, containing the landing page, 3D architecture visualization, chat interface, animations, and API communication.

## `frontend/src/app/`

Defines Next.js routes and pages, separating the cinematic marketing experience from the actual Nexus application.

## `frontend/src/components/landing/`

Contains the Nexus landing-page sections that explain the problem, architecture, multi-agent system, trust layer, and product experience.

## `frontend/src/components/three/`

Powers the 3D architecture visualization, representing Nexus, domain agents, knowledge sources, connections, particles, and camera movement.

## `frontend/src/components/chat/`

Contains the interactive assistant UI, including messages, routing status, confidence, agent activity, and source citations.

## `frontend/src/services/`

Acts as the frontend API layer, handling communication between the Next.js interface and FastAPI backend.

## `frontend/src/types/`

Defines TypeScript contracts for chat requests, responses, sources, knowledge documents, and other API data.

---

## `backend/`

The core intelligence layer of Nexus, responsible for routing, agents, RAG, LLM interaction, knowledge processing, and API services.

## `backend/app/main.py`

The entry point of the FastAPI application, registering API routes and initializing the Nexus backend.

## `backend/app/api/`

Contains the REST API endpoints through which the frontend communicates with Nexus.

## `backend/app/services/`

Contains the application-level business logic, coordinating API requests with orchestration, RAG, agents, and database operations.

## `backend/app/orchestration/`

The **brain of Nexus**. It understands user intent, decomposes multi-intent queries, routes requests to domain agents, manages confidence, and combines their responses.

## `backend/app/agents/`

Contains specialized domain agents such as HR, IT, and Finance that independently handle queries using their respective knowledge bases.

## `backend/app/rag/`

The knowledge retrieval engine, responsible for document ingestion, chunking, embeddings, vector search, and retrieving relevant evidence for agents.

## `backend/app/llm/`

Handles LLM communication, prompts, model configuration, and structured response processing.

## `backend/app/db/`

Manages persistent application data, including conversations, documents, document chunks, embeddings, and feedback.

## `backend/app/schemas/`

Defines Pydantic request and response models, ensuring API data is validated and consistently structured.

## `backend/app/core/`

Contains backend configuration and infrastructure utilities, including environment variables, security, logging, and application settings.

## `backend/data/`

Stores the enterprise knowledge sources used by Nexus, organized into HR, IT, Finance, and other domains.

## `backend/tests/`

Contains automated tests for routing, RAG retrieval, agents, APIs, and core Nexus functionality.

---

## `docs/`

Contains project documentation, including architecture, API contracts, database design, and evaluation methodology.

## `docker-compose.yml`

Defines the local multi-service environment, allowing Nexus services and infrastructure such as PostgreSQL to run consistently.

---

# Core Nexus Flow

```text
User
  ↓
Next.js Frontend
  ↓
FastAPI
  ↓
Orchestrator ← BRAIN OF NEXUS
  ↓
Intent + Routing
  ↓
HR / IT / Finance Agents
  ↓
RAG Retriever
  ↓
Knowledge Base + Vector Database
  ↓
LLM
  ↓
Response Synthesizer
  ↓
Grounded Answer + Sources + Confidence
  ↓
Frontend
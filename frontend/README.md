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
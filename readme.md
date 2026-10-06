# Beacon — Enterprise AI Query Router & Chat

## 🏗️ Architecture Overview

This project is built using a modern decoupled architecture, combining a responsive Next.js 15 frontend with a high-performance Python FastAPI backend, supported by local LLM orchestration and Supabase.

### 🎨 Frontend (UI & Client)
- **Framework**: Next.js 15 (App Router), React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4, Vanilla CSS (`index.css` for background gradients and noise)
- **Animations & Graphics**: Framer Motion (page/component transitions), GSAP, `@react-three/fiber` / `@react-three/drei` (3D rendering capabilities)
- **UI Components**: Radix UI Primitives (headless components)
- **Auth & State**: Supabase SSR (`@supabase/ssr`, `@supabase/supabase-js`)
- **Key Files**: 
  - `app/auth/page.tsx` (Supabase Login/Signup)
  - `app/assistant/page.tsx` (Chat Interface fetching from Backend)

### ⚙️ Backend (API & Orchestration)
- **Framework**: FastAPI (Python)
- **Language**: Python 3.10+
- **LLM Orchestration**: Ollama-based zero-shot intent classifier (`beacon-router` model).
- **Core Libraries**: `pydantic`, `ollama`, `transformers`, `torch`, `sentencepiece`
- **Endpoints**: 
  - `POST /api/chat`: Receives user query, runs Ollama classification, and returns domain-specific RAG responses.
  - `GET /api/health`: Health check endpoint.
- **Key Directories**: 
  - `backend/app/api/routes` (FastAPI controllers)
  - `backend/app/orchestration` (Classification and routing logic)

### 🗄️ Database (Supabase / PostgreSQL)
- **Provider**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (JWT, `auth.users` table)
- **Schema**:
  - `public.profiles`: Stores user metadata (linked to `auth.users` via trigger).
  - `public.chats`: Stores chat session history.
  - `public.messages`: Stores individual messages tied to a chat.
- **Security**: Row Level Security (RLS) is strictly enforced so users can only access their own data.

### 🔄 System Approach & Request Flow
The core approach behind Beacon relies on a multi-intent, hybrid query routing system ensuring queries are directed to the correct domain-specific knowledge bases.

1. **User Input:** A user enters a query on the Next.js frontend.
2. **Backend Processing:** The query is forwarded to the FastAPI backend (`/api/chat`).
3. **Intent Classification (Ollama):** The zero-shot classifier running on a local Ollama instance (`beacon-router`) analyzes the query and classifies it into an enterprise domain (HR, IT, Finance) or flags it as out-of-scope / needing clarification.
4. **Domain Routing:** The backend router captures the intent and determines the correct Azure RAG (Retrieval-Augmented Generation) pipeline.
5. **Knowledge Retrieval (Azure RAG):** The system securely retrieves contextually relevant evidence from the specific domain's knowledge base. *(Note: Currently in development/simulation phase).*
6. **Response Generation:** The LLM forms a coherent answer grounded *only* in the retrieved evidence.
7. **Client Delivery:** The final answer, along with cited sources, is returned to the frontend and displayed to the user via the chat interface.

---

# Nexus — Complete GitHub Workflow

## 1. First Time Only — Clone the Repository

```bash
git clone https://github.com/vaibhavguptahere/microsoft_hackathon.git
cd microsoft_hackathon
```

Check branches:

```bash
git branch
```

---

## 2. Create Your Own Branch

> **Never work directly on `main`.**

```bash
git checkout -b feature/your-name
```

Examples:

```bash
git checkout -b feature/vaibhav
git checkout -b feature/nishika
git checkout -b feature/isha
git checkout -b feature/giri
```

---

## 3. Every Time You Start Working

First, update `main`:

```bash
git checkout main
git pull origin main
```

Then go back to your branch:

```bash
git checkout feature/your-name
```

Bring the latest `main` changes into your branch:

```bash
git merge main
```

Now start coding.

### If Nothing Was Merged Into `main`

That's completely fine.

```bash
git pull origin main
```

You may see:

```text
Already up to date.
```

Your code is safe.

---

## 4. Work on Your Code

Make your changes normally.

Check what changed:

```bash
git status
```

---

## 5. Save Your Work

Add your changes:

```bash
git add .
```

Commit your changes:

```bash
git commit -m "Add RAG retrieval"
```

Examples:

```bash
git commit -m "Add HR agent"
git commit -m "Create chat interface"
git commit -m "Add document ingestion"
git commit -m "Add 3D architecture"
```

---

## 6. Push Your Branch

### First Push

```bash
git push -u origin feature/your-name
```

### After the First Push

```bash
git push
```

Your code is now available on GitHub under your branch.

---

## 7. Create a Pull Request

After pushing your branch:

### Step 1

Open the GitHub repository in your browser.

### Step 2

You will usually see a message like:

```text
feature/your-name had recent pushes
[Compare & pull request]
```

Click **Compare & pull request**.

If you don't see it:

```text
Repository
   ↓
Pull requests
   ↓
New pull request
```

### Step 3 — Select Branches

Make sure:

```text
base repository:   nexus
base:              main

compare:           feature/your-name
```

It should look like:

```text
main  ←  feature/your-name
```

### Step 4 — Add Pull Request Title

Example:

```text
Add RAG Retrieval Pipeline
```

### Step 5 — Add Description

Keep it simple:

```markdown
## Changes
- Added document ingestion
- Added text chunking
- Added vector retrieval

## Testing
- Tested document upload
- Tested retrieval API
```

### Step 6

Click **Create pull request**.

---

## 8. After Creating the Pull Request

Do not merge your own PR immediately unless the team has agreed that you can.

Ask another teammate to review your code.

```text
Your Branch
     ↓
Pull Request
     ↓
Code Review
     ↓
Approved
     ↓
Merge into main
```

---

## 9. If Changes Are Requested

Make the requested changes on the same branch.

```bash
git add .
git commit -m "Fix review comments"
git push
```

Your existing Pull Request will automatically update. You do not need to create another PR.

---

## 10. Before Your PR Gets Merged

If another teammate has merged new code into `main`, update your branch:

```bash
git checkout main
git pull origin main
git checkout feature/your-name
git merge main
```

Then:

```bash
git push
```

Your Pull Request will be updated.

---

## 11. After Your PR Is Merged

Once your PR is merged into `main`:

```bash
git checkout main
git pull origin main
```

Now `main` contains your changes.

For your next task, create a new branch:

```bash
git checkout -b feature/new-feature
```

---

## ⚠️ Important Team Rules

### Rule 1 — Never Code Directly on `main`

❌ Don't:

```bash
git checkout main

# Write code

git add .
git commit
git push
```

✅ Always use your own branch:

```bash
git checkout -b feature/your-name
```

### Rule 2 — Pull `main` Before Starting Work

Every time you start working:

```bash
git checkout main
git pull origin main
git checkout feature/your-name
git merge main
```

### Rule 3 — Your Code Will Not Be Deleted

Running:

```bash
git pull origin main
```

updates your local `main`. It does **not** delete your feature branch or your committed work.

```text
main
│
├── Team's merged code
│
└── feature/your-name
      └── Your code
```

### Rule 4 — Commit Before Switching Branches

If you have unfinished changes:

```bash
git add .
git commit -m "WIP: working on router"
```

Then switch branches.

### Rule 5 — One Teammate = One Feature Branch

```text
main
│
├── feature/vaibhav-backend
├── feature/member2-rag
├── feature/member3-cloud
└── feature/member4-frontend
```

Don't work on someone else's branch.

### Rule 6 — Before Creating a PR, Update Your Branch

```bash
git checkout main
git pull origin main
git checkout feature/your-name
git merge main
git push
```

Then create/update the Pull Request.

---

## 🚀 Complete Workflow

```text
START
  │
  ▼
git checkout main
  │
  ▼
git pull origin main
  │
  ▼
git checkout your-branch
  │
  ▼
git merge main
  │
  ▼
WRITE CODE
  │
  ▼
git add .
  │
  ▼
git commit -m "..."
  │
  ▼
git push
  │
  ▼
CREATE PULL REQUEST
  │
  ▼
CODE REVIEW
  │
  ├── Changes requested
  │       ↓
  │   Make changes
  │       ↓
  │   git push
  │
  ▼
APPROVED
  │
  ▼
MERGE → main
  │
  ▼
git checkout main
git pull origin main
  │
  ▼
CREATE NEW BRANCH
```

---

## ⭐ Commands to Remember

```bash
# Start work
git checkout main
git pull origin main
git checkout feature/your-name
git merge main

# Work on your code

# Save changes
git add .
git commit -m "your message"
git push

# Then create Pull Request on GitHub
```

> **Golden Rule:**
> Pull → Update your branch → Code → Commit → Push → Pull Request → Review → Merge
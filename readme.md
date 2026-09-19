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
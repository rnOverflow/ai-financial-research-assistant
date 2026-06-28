#!/bin/bash
# ─────────────────────────────────────────────────────────────
#  Push to GitHub
# ─────────────────────────────────────────────────────────────

set -e
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

REPO_NAME="ai-financial-research-assistant"

echo ""
echo -e "${CYAN}Initializing git repo and pushing to GitHub...${NC}"
echo ""

# Init git
git init
git add .
git commit -m "feat: initial commit — AI Financial Research Assistant

- RAG pipeline: PDF → PyMuPDF → chunking → FAISS (sentence-transformers embeddings)
- FastAPI backend with endpoints: upload, ask, summarize, insights, memo, compare, entities
- Finance NLP: risk extraction, forward guidance detection, financial metric regex, sentiment scoring
- Groq LLaMA 3 70B integration for Q&A, executive summaries, investment memos
- React/Vite frontend: Bloomberg-inspired dark terminal UI
- Features: Research Chat, Financial Insights dashboard, Investment Memo generator, Document Comparison"

echo ""
echo -e "${YELLOW}Now push to GitHub:${NC}"
echo ""
echo -e "  1. Create a new repo at: ${CYAN}https://github.com/new${NC}"
echo -e "     Name it: ${CYAN}$REPO_NAME${NC}"
echo -e "     Set to Public, no README (we have one)"
echo ""
echo -e "  2. Run these commands:"
echo ""
echo -e "     ${GREEN}git remote add origin https://github.com/YOUR_USERNAME/$REPO_NAME.git${NC}"
echo -e "     ${GREEN}git branch -M main${NC}"
echo -e "     ${GREEN}git push -u origin main${NC}"
echo ""

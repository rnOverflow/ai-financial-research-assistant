#!/bin/bash
# ─────────────────────────────────────────────────────────────
#  AI Financial Research Assistant — macOS Setup Script
# ─────────────────────────────────────────────────────────────

set -e
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo -e "${YELLOW}╔══════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║   AI Financial Research Assistant Setup      ║${NC}"
echo -e "${YELLOW}╚══════════════════════════════════════════════╝${NC}"
echo ""

# ── 1. Check Python ────────────────────────────────────────────
echo -e "${CYAN}[1/5] Checking Python...${NC}"
if ! command -v python3 &>/dev/null; then
    echo -e "${RED}Python 3 not found. Install from https://python.org${NC}"
    exit 1
fi
PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
echo -e "${GREEN}✓ Python $PYTHON_VERSION found${NC}"

# ── 2. Backend ─────────────────────────────────────────────────
echo ""
echo -e "${CYAN}[2/5] Setting up backend...${NC}"
cd backend
python3 -m venv venv
source venv/bin/activate
pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt
echo -e "${GREEN}✓ Backend dependencies installed${NC}"

# ── 3. .env ────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}[3/5] Checking .env file...${NC}"
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo -e "${YELLOW}⚠  Created .env from template.${NC}"
    echo -e "${YELLOW}   → Open backend/.env and add your GROQ_API_KEY${NC}"
    echo -e "${YELLOW}   → Get a free key at: https://console.groq.com${NC}"
else
    echo -e "${GREEN}✓ .env already exists${NC}"
fi
cd ..

# ── 4. Frontend ────────────────────────────────────────────────
echo ""
echo -e "${CYAN}[4/5] Setting up frontend...${NC}"
if ! command -v node &>/dev/null; then
    echo -e "${RED}Node.js not found. Install from https://nodejs.org${NC}"
    exit 1
fi
cd frontend
npm install --silent
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
cd ..

# ── 5. Done ────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║            Setup complete! ✓                 ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${YELLOW}IMPORTANT: Add your Groq API key to backend/.env${NC}"
echo -e "  Get it free at: https://console.groq.com"
echo ""
echo -e "  ${CYAN}To run the app, open two terminals:${NC}"
echo ""
echo -e "  Terminal 1 (backend):"
echo -e "    cd backend && source venv/bin/activate"
echo -e "    uvicorn app.main:app --reload"
echo ""
echo -e "  Terminal 2 (frontend):"
echo -e "    cd frontend && npm run dev"
echo ""
echo -e "  Then open: ${CYAN}http://localhost:5173${NC}"
echo ""

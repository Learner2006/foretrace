# ForeTrace

A structural intelligence platform for company analysis. ForeTrace pulls SEC 10-K filings, extracts financial and operational signals, and uses language models to evaluate corporate health, market positioning, and historical analogs.

**This is not a stock prediction app, trading bot, or financial dashboard.**  
It is an explainable intelligence workspace for people who want to understand what a company is actually becoming.

> **Status: Active development.** Core architecture and analysis workflows are functional. UI and intelligence layers are being iterated on.

---

## The Core Question

> *What kind of company is this becoming — how structurally healthy is it, what market forces shape it, what historical situations resemble it, and what risks and opportunities emerge from that?*

Most finance tools answer: *what happened?*  
Some answer: *what may happen?*  
ForeTrace answers: *what historically similar situations existed, why they mattered, and what structural outcomes followed.*

---

## Screenshots

**Homepage — Structural Intelligence Platform**
![Homepage](./screenshots/homepage.png)

**Market Structure Feed — Shifts detected this quarter**
![Market Structure Feed](./screenshots/market-structure.png)

**Analog Engine — History doesn't repeat. But structure does.**
![Analog Engine](./screenshots/analog-engine.png)

**Reasoning Engine — Not a score. A chain of evidence.**
![Reasoning Engine](./screenshots/reasoning-engine.png)

---

## What It Does

**Structural Evaluation** — Financial health, survivability, debt stress, cash flow quality, and operational stability. Can this company survive and remain competitive?

**Market Position Intelligence** — Sector alignment, competitive ecosystem strength, dependency exposure, and structural momentum. How strong is this company within its ecosystem?

**Historical Analog Intelligence** — Identifies historically similar companies and trajectories using trend fingerprinting and DTW similarity search. Pattern matching on extracted data — not vibes.

**Explainable Reasoning** — Every insight surfaces *why* it was generated, *what evidence* supports it, and *what confidence* it carries. No black-box assertions.

**Structural Risk Tracking** — Concentration risks, debt stress, disruption exposure, macro vulnerability. What could structurally weaken this company?

---

## Design Philosophy

The user should leave feeling *"I understand this company better now"* — not *"I saw a lot of complicated charts."*

- Every visualization explains why it matters, not just what it shows
- Calm, research-oriented UI — not a trading terminal
- Explainability is non-negotiable: every output traces back to source data
- Reliability and clarity before flashy AI or fancy animations

---

## Architecture

| Layer | Responsibility |
|---|---|
| Market Data Infrastructure | Ingestion, normalization, macro data, historical storage |
| Structural Intelligence Engine | Sector correlation, divergence detection, regime classification |
| Historical Analog Engine | Trend fingerprinting, DTW similarity, analog ranking |
| Sentiment Intelligence | FinBERT analysis, earnings sentiment, narrative shifts |
| Risk Intelligence | Bankruptcy risk, concentration risk, debt stress, survivability |
| Explainability | AI summaries, confidence estimation, evidence surfacing |
| Security | Auth, RBAC, tenant isolation, encryption, audit logging |

---

## Stack

**Backend** — FastAPI · Python · SEC EDGAR client · Groq (`llama-3.3-70b-versatile`) · Slowapi

**Frontend** — React (Vite) · Tailwind CSS

---

## Setup

### 1. Clone

```bash
git clone https://github.com/Learner2006/foretrace.git
cd foretrace
```

### 2. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create `.env` in `backend/`:

```
GROQ_API_KEY=your_groq_api_key
```

### 3. Frontend

```bash
cd ../frontend
npm install
npm run dev
```

---

## Security

- Strict CORS origin matching
- Rate limiting on all business logic routes
- Environment secrets fully isolated
- Designed for enterprise-grade use: sensitive filings, confidential evaluations

---

## What This Platform Will Never Do

- Emit buy/sell signals
- Guarantee predictions
- Ship models that cannot explain their reasoning
- Replace analysts or make executive decisions
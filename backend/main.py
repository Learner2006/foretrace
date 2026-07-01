import os
import logging
from typing import Optional

import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Rate limiting stuff
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Local imports
from sec_client import get_cik, get_latest_10k_text, get_indian_company_text, is_indian_ticker
from ai_analyzer import analyze_company, extract_financial_signals

load_dotenv()

# Setup basic logging
logger = logging.getLogger("foretrace.main")
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s"))
    logger.addHandler(handler)
    logger.setLevel(os.getenv("LOG_LEVEL", "INFO"))

# App Setup

# 10 requests per minute per IP. If you hit this, you're probably testing too hard.
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="ForeTrace API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS - restricted to dev servers for now. 
# TODO: Add your production domain here when you actually deploy this.
origins = [
    "http://localhost:5173",   # Vite dev server
    "http://localhost:3000",   # fallback dev
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models

class AnalyzeRequest(BaseModel):
    company_name: str
    ticker: Optional[str] = None

# Helpers & Cache

# Simple in-memory cache for the SEC ticker list so we don't download it every request.
# It's not persistent (restarts clear it), but it's enough for a demo/internship project.
_sec_ticker_cache: Optional[dict] = None

async def get_sec_ticker_data() -> dict:
    global _sec_ticker_cache
    if _sec_ticker_cache is not None:
        return _sec_ticker_cache
    
    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(
                "https://www.sec.gov/files/company_tickers.json",
                headers={"User-Agent": "ForeTrace research@foretrace.com"}
            )
            _sec_ticker_cache = r.json()
            return _sec_ticker_cache
    except Exception as e:
        logger.warning(f"Failed to fetch SEC ticker data: {e}")
        return {}

# Endpoints

@app.post("/analyze")
@limiter.limit("10/minute")
async def analyze(request: Request, req: AnalyzeRequest):
    """
    Main endpoint. Fetches filing text and delegates analysis to ai_analyzer.
    """
    
    filing_text = None
    
    # 1. Check Indian Ticker first (usually faster/easier source)
    if req.ticker and is_indian_ticker(req.ticker):
        filing_text = await get_indian_company_text(req.ticker)
        if not filing_text:
            raise HTTPException(status_code=404, detail="Indian company data not found.")
    
    # 2. If not Indian, try SEC EDGAR
    else:
        cik = None
        
        # Try ticker first using our cached data
        if req.ticker:
            tickers_data = await get_sec_ticker_data()
            for key, val in tickers_data.items():
                if val["ticker"].upper() == req.ticker.upper():
                    cik = str(val["cik_str"])
                    break

        # Try name if ticker failed or wasn't provided
        if not cik:
            cik = await get_cik(req.company_name)

        if not cik:
            raise HTTPException(status_code=404, detail="Company not found in SEC EDGAR.")

        filing_text = await get_latest_10k_text(cik)
        if not filing_text:
            raise HTTPException(status_code=404, detail="10-K filing not found.")

    # 3. Delegate to the AI Analyzer
    result = await analyze_company(req.company_name, filing_text)
    
    # 4. Add raw signals for frontend debugging/charting
    # We call this again here because it's cheap/local, and the frontend might want raw data
    result["structural_signals"] = extract_financial_signals(filing_text)
    
    return result

@app.get("/health")
async def health():
    return {"status": "ok"}
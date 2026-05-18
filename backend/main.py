from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv
import os
import re
import json

from sec_client import get_cik, get_latest_10k_text, get_indian_company_text, is_indian_ticker
from ai_analyzer import analyze_company, extract_financial_signals

load_dotenv()

app = FastAPI(title="ForeTrace API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # dev mode — restrict in prod
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalyzeRequest(BaseModel):
    company_name: str
    ticker: Optional[str] = None

@app.post("/analyze")
async def analyze(req: AnalyzeRequest):

    # Indian company check
    if req.ticker and is_indian_ticker(req.ticker):
        filing_text = await get_indian_company_text(req.ticker)
        if not filing_text:
            raise HTTPException(status_code=404, detail="Indian company data nahi mila Yahoo Finance se")

        result = await analyze_company(req.company_name, filing_text)
        result["structural_signals"] = extract_financial_signals(filing_text)
        return result
    # Ticker se CIK dhundho (more accurate)
    cik = None

    if req.ticker:
        try:
            import httpx
            async with httpx.AsyncClient() as client:
                r = await client.get(
                    "https://www.sec.gov/files/company_tickers.json",
                    headers={"User-Agent": "ForeTrace research@foretrace.com"}
                )
                tickers_data = r.json()
                for key, val in tickers_data.items():
                    if val["ticker"].upper() == req.ticker.upper():
                        cik = str(val["cik_str"])
                        break
        except Exception:
            cik = None

    # Ticker se nahi mila toh company name se try karo
    if not cik:
        cik = await get_cik(req.company_name)

    if not cik:
        raise HTTPException(status_code=404, detail="Company SEC EDGAR pe nahi mili")

    filing_text = await get_latest_10k_text(cik)
    if not filing_text:
        raise HTTPException(status_code=404, detail="10-K filing nahi mili")

    result = await analyze_company(req.company_name, filing_text)
    result["structural_signals"] = extract_financial_signals(filing_text)
    return result

@app.get("/health")
async def health():
    return {"status": "ok"}
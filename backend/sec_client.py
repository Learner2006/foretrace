import httpx
import re
from typing import Optional
import asyncio
import yfinance as yf
import time
import logging

logger = logging.getLogger("foretrace.sec_client")

# SEC requires a valid email in the User-Agent. 
# If this isn't a real email, replace it before deploying.
HEADERS = {"User-Agent": "ForeTrace research@foretrace.com"}

# Simple cache for CIKs so we don't hit SEC every time for the same company.
# It's not persistent (restarts clear it), but it's enough for now.
_cik_cache = {}

# Cache for the big ticker list from SEC
_ticker_data_cache = None
_last_ticker_fetch = 0
TICKER_CACHE_TTL = 3600  # 1 hour


async def get_cik(company_name: str) -> Optional[str]:
    """
    Searches SEC EDGAR for a company name and returns its CIK.
    Returns the first match that looks right. 
    Note: This search can be fuzzy, so it might return the wrong entity if names are similar.
    """
    # Check cache first
    if company_name in _cik_cache:
        return _cik_cache[company_name]

    try:
        async with httpx.AsyncClient() as client:
            # URL encode the query manually or let httpx handle it? Let's keep it simple.
            r = await client.get(
                f"https://efts.sec.gov/LATEST/search-index?q=%22{company_name}%22&forms=10-K",
                headers=HEADERS
            )
            
            if r.status_code != 200:
                logger.warning(f"SEC search failed for {company_name}: {r.status_code}")
                return None
                
            data = r.json()
            hits = data.get("hits", {}).get("hits", [])
            
            if not hits:
                return None

            # Try to find an exact-ish match first
            for hit in hits:
                source = hit["_source"]
                display_names = source.get("display_names", [])
                for name in display_names:
                    if company_name.lower() in name.lower():
                        ciks = source.get("ciks", [])
                        if ciks:
                            # CIKs often have leading zeros, strip them
                            cik = ciks[0].lstrip("0")
                            _cik_cache[company_name] = cik
                            return cik

            # Fallback to the first result if no good match found
            first = hits[0]["_source"]
            ciks = first.get("ciks", [])
            if ciks:
                cik = ciks[0].lstrip("0")
                _cik_cache[company_name] = cik
                return cik
                
    except Exception as e:
        logger.error(f"Error fetching CIK for {company_name}: {e}")
        
    return None


async def get_indian_company_text(ticker: str) -> Optional[str]:
    """
    Fetches basic financial data for Indian companies (.NS or .BO) using yfinance.
    Since yfinance is synchronous, we run it in an executor to avoid blocking.
    It's not a full 10-K, but it's enough for the signal extractor to work with.
    """
    try:
        loop = asyncio.get_event_loop()
        # Run synchronous yfinance call in a thread
        info = await loop.run_in_executor(None, lambda: yf.Ticker(ticker).info)

        if not info or "longName" not in info:
            return None

        parts = []

        if info.get("longBusinessSummary"):
            parts.append(f"Business Summary: {info['longBusinessSummary']}")

        if info.get("sector"):
            parts.append(f"Sector: {info['sector']}")

        if info.get("industry"):
            parts.append(f"Industry: {info['industry']}")

        if info.get("totalRevenue"):
            parts.append(f"Total Revenue: {info['totalRevenue']:,}")

        if info.get("revenueGrowth"):
            parts.append(f"Revenue Growth: {info['revenueGrowth'] * 100:.1f}%")

        if info.get("profitMargins"):
            parts.append(f"Profit Margins: {info['profitMargins'] * 100:.1f}%")

        if info.get("debtToEquity"):
            parts.append(f"Debt to Equity: {info['debtToEquity']}")

        if info.get("returnOnEquity"):
            parts.append(f"Return on Equity: {info['returnOnEquity'] * 100:.1f}%")

        if info.get("fullTimeEmployees"):
            parts.append(f"Employees: {info['fullTimeEmployees']:,}")

        if info.get("country"):
            parts.append(f"Country: {info['country']}")

        return "\n".join(parts) if parts else None

    except Exception as e:
        logger.error(f"yfinance error for {ticker}: {e}") # Fixed print() to logger
        return None


def is_indian_ticker(ticker: str) -> bool:
    """Check if ticker ends with .NS (NSE) or .BO (BSE)."""
    return ticker.upper().endswith(".NS") or ticker.upper().endswith(".BO")


async def _get_ticker_data() -> dict:
    """Fetches and caches the SEC ticker-to-CIK mapping."""
    global _ticker_data_cache, _last_ticker_fetch
    
    current_time = time.time()
    if _ticker_data_cache and (current_time - _last_ticker_fetch) < TICKER_CACHE_TTL:
        return _ticker_data_cache

    try:
        async with httpx.AsyncClient() as client:
            r = await client.get("https://www.sec.gov/files/company_tickers.json", headers=HEADERS)
            if r.status_code == 200:
                _ticker_data_cache = r.json()
                _last_ticker_fetch = current_time
                return _ticker_data_cache
    except Exception as e:
        logger.error(f"Failed to fetch SEC ticker data: {e}")
    
    return {}


async def get_latest_10k_text(cik: str) -> Optional[str]:
    """
    Fetches the latest 10-K filing text for a given CIK.
    It goes through the submission index, finds the latest 10-K, 
    then scrapes the actual document link.
    """
    try:
        cik_padded = str(cik).zfill(10)
        url = f"https://data.sec.gov/submissions/CIK{cik_padded}.json"
        
        async with httpx.AsyncClient() as client:
            r = await client.get(url, headers=HEADERS)
            if r.status_code != 200:
                return None
                
            data = r.json()
            filings = data.get("filings", {}).get("recent", {})
            forms = filings.get("form", [])
            accession_numbers = filings.get("accessionNumber", [])

            # Find the first (most recent) 10-K
            for i, form in enumerate(forms):
                if form == "10-K":
                    accession = accession_numbers[i].replace("-", "")
                    acc_formatted = accession_numbers[i]
                    
                    # Get the index page for this filing
                    doc_url = f"https://www.sec.gov/Archives/edgar/data/{int(cik)}/{accession}/{acc_formatted}-index.htm"
                    
                    index_r = await client.get(doc_url, headers=HEADERS)
                    if index_r.status_code != 200:
                        continue
                        
                    # Regex to find the main filing link (usually the first .htm link that isn't the index itself)
                    match = re.search(r'href="(/Archives/edgar/data/[\w/\-]+\.htm)"', index_r.text)
                    if match:
                        filing_url = "https://www.sec.gov" + match.group(1)
                        filing_r = await client.get(filing_url, headers=HEADERS)
                        if filing_r.status_code == 200:
                            return extract_signal_text(filing_r.text)
                            
            return None
            
    except Exception as e:
        logger.error(f"Error fetching 10-K for CIK {cik}: {e}")
        return None


def extract_signal_text(raw_html: str) -> str:
    """
    Raw 10-K HTML se signal-rich sections nikaalte hain.
    Item 1 (Business), Item 1A (Risk Factors), Item 7 (MD&A) prefer karo.
    ~6000 chars — enough context, rate limit safe.
    
    Note: This regex is brittle. If SEC changes their item numbering or HTML structure, 
    this will fail silently and return raw text.
    """
    # Strip HTML tags and entities
    text = re.sub(r'<[^>]+>', ' ', raw_html)
    text = re.sub(r'&[a-zA-Z]+;', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()

    # Remove short lines and boilerplate numbers/dates
    lines = text.split('. ')
    clean_lines = []
    for line in lines:
        line = line.strip()
        if len(line) < 30:
            continue
        # Skip lines that are just numbers/dates/slashes
        if re.match(r'^[\d\s\-\/]+$', line):
            continue
        clean_lines.append(line)
    
    clean = '. '.join(clean_lines)

    # Try to find specific items known for high signal density
    signal_sections = []
    item_patterns = [
        r'(item\s+1[^a].*?(?=item\s+1a|item\s+2|$))',  # Item 1: Business
        r'(item\s+1a.*?(?=item\s+1b|item\s+2|$))',     # Item 1A: Risk Factors
        r'(item\s+7[^a].*?(?=item\s+7a|item\s+8|$))',  # Item 7: MD&A
    ]
    
    for pattern in item_patterns:
        found = re.search(pattern, clean[:60000], re.IGNORECASE | re.DOTALL)
        if found:
            signal_sections.append(found.group(1)[:2000].strip())

    # If we found specific sections, join them. Otherwise, return the start of the clean text.
    if signal_sections:
        return ' | '.join(signal_sections)[:6000]

    return clean[:6000]
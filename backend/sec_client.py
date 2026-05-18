import httpx
import re
from typing import Optional
import asyncio
import yfinance as yf

BASE_URL = "https://efts.sec.gov/LATEST/search-index?q={query}&dateRange=custom&startdt=2020-01-01&enddt=2024-12-31&forms=10-K"
HEADERS = {"User-Agent": "ForeTrace research@foretrace.com"}

async def get_cik(company_name: str) -> Optional[str]:
    async with httpx.AsyncClient() as client:
        r = await client.get(
            f"https://efts.sec.gov/LATEST/search-index?q=%22{company_name}%22&forms=10-K",
            headers=HEADERS
        )
        data = r.json()
        hits = data.get("hits", {}).get("hits", [])
        if not hits:
            return None

        for hit in hits:
            source = hit["_source"]
            display_names = source.get("display_names", [])
            for name in display_names:
                if company_name.lower() in name.lower():
                    ciks = source.get("ciks", [])
                    if ciks:
                        return ciks[0].lstrip("0")

        first = hits[0]["_source"]
        ciks = first.get("ciks", [])
        return ciks[0].lstrip("0") if ciks else None

async def get_indian_company_text(ticker: str) -> Optional[str]:
    try:
        # yfinance synchronous hai — thread mein run karo
        loop = asyncio.get_event_loop()
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
        print(f"yfinance error: {e}")
        return None

def is_indian_ticker(ticker: str) -> bool:
    return ticker.upper().endswith(".NS") or ticker.upper().endswith(".BO")

async def get_latest_10k_text(cik: str) -> Optional[str]:
    cik_padded = str(cik).zfill(10)
    url = f"https://data.sec.gov/submissions/CIK{cik_padded}.json"
    async with httpx.AsyncClient() as client:
        r = await client.get(url, headers=HEADERS)
        data = r.json()
        filings = data.get("filings", {}).get("recent", {})
        forms = filings.get("form", [])
        accession_numbers = filings.get("accessionNumber", [])

        for i, form in enumerate(forms):
            if form == "10-K":
                accession = accession_numbers[i].replace("-", "")
                acc_formatted = accession_numbers[i]
                doc_url = f"https://www.sec.gov/Archives/edgar/data/{int(cik)}/{accession}/{acc_formatted}-index.htm"

                index_r = await client.get(doc_url, headers=HEADERS)
                match = re.search(r'href="(/Archives/edgar/data/[\w/\-]+\.htm)"', index_r.text)
                if match:
                    filing_url = "https://www.sec.gov" + match.group(1)
                    filing_r = await client.get(filing_url, headers=HEADERS)
                    return extract_signal_text(filing_r.text)
        return None

def extract_signal_text(raw_html: str) -> str:
    """
    Raw 10-K HTML se signal-rich sections nikaalte hain.
    Item 1 (Business), Item 1A (Risk Factors), Item 7 (MD&A) prefer karo.
    ~6000 chars — enough context, rate limit safe.
    """
    # HTML + entity strip
    text = re.sub(r'<[^>]+>', ' ', raw_html)
    text = re.sub(r'&[a-zA-Z]+;', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()

    # Boilerplate hataao
    lines = text.split('. ')
    clean_lines = []
    for line in lines:
        line = line.strip()
        if len(line) < 30:
            continue
        if re.match(r'^[\d\s\-\/]+$', line):
            continue
        clean_lines.append(line)
    clean = '. '.join(clean_lines)

    # Signal sections dhundo
    signal_sections = []
    item_patterns = [
        r'(item\s+1[^a].*?(?=item\s+1a|item\s+2|$))',
        r'(item\s+1a.*?(?=item\s+1b|item\s+2|$))',
        r'(item\s+7[^a].*?(?=item\s+7a|item\s+8|$))',
    ]
    for pattern in item_patterns:
        found = re.search(pattern, clean[:60000], re.IGNORECASE | re.DOTALL)
        if found:
            signal_sections.append(found.group(1)[:2000].strip())

    if signal_sections:
        return ' | '.join(signal_sections)[:6000]

    return clean[:6000]
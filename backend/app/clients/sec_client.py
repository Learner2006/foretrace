import httpx
import asyncio
from typing import Optional, Dict, Any
from app.utils.logger import logger
from app.utils.circuit_breaker import CircuitBreaker

sec_circuit = CircuitBreaker("SEC API")

class SECClient:
    def __init__(self):
        self.efts_url = "https://efts.sec.gov/LATEST/search-index"
        self.tickers_url = "https://www.sec.gov/files/company_tickers.json"
        self.submissions_url = "https://data.sec.gov/submissions/CIK{}.json"
        self.archives_url = "https://www.sec.gov/Archives/edgar/data/{}/{}/{}"
        self.headers = {"User-Agent": "ForeTrace research@foretrace.com"}

    @sec_circuit
    async def _get_with_retry(self, url: str, params: Optional[dict] = None, timeout: float = 15.0) -> httpx.Response:
        base_delay = 1.0
        max_retries = 3
        
        async def make_request():
            async with httpx.AsyncClient(timeout=timeout) as client:
                r = await client.get(url, params=params, headers=self.headers)
                r.raise_for_status()
                return r
                
        for attempt in range(max_retries):
            try:
                return await make_request()
            except Exception as e:
                if attempt == max_retries - 1:
                    raise e
                delay = base_delay * (2 ** attempt)
                logger.warning(f"SEC request attempt {attempt + 1} failed: {e}. Retrying in {delay}s...")
                await asyncio.sleep(delay)

    async def search_company_cik(self, company_name: str) -> Optional[str]:
        try:
            logger.info(f"Searching CIK for '{company_name}'", extra={"metadata": {"event": "outgoing_api_call", "target": "sec_efts"}})
            r = await self._get_with_retry(f"{self.efts_url}?q=%22{company_name}%22&forms=10-K")
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
        except Exception as e:
            logger.error(f"Failed to search CIK for '{company_name}': {e}", extra={"metadata": {"event": "sec_api_failure", "endpoint": "search_index", "error": str(e)}})
            raise e

    async def get_cik_by_ticker(self, ticker: str) -> Optional[str]:
        try:
            logger.info(f"Fetching SEC tickers list", extra={"metadata": {"event": "outgoing_api_call", "target": "sec_tickers"}})
            r = await self._get_with_retry(self.tickers_url, timeout=10.0)
            tickers_data = r.json()
            for _, val in tickers_data.items():
                if val["ticker"].upper() == ticker.upper():
                    return str(val["cik_str"])
        except Exception as e:
            logger.warning(f"Error looking up CIK by ticker {ticker}: {e}", extra={"metadata": {"event": "sec_api_failure", "endpoint": "company_tickers", "error": str(e)}})
            raise e
        return None

    async def get_latest_10k_url(self, cik: str) -> Optional[str]:
        try:
            cik_padded = str(cik).zfill(10)
            url = self.submissions_url.format(cik_padded)
            logger.info(f"Fetching submissions for CIK {cik}", extra={"metadata": {"event": "outgoing_api_call", "target": "sec_submissions"}})
            r = await self._get_with_retry(url)
            data = r.json()
            recent = data.get("filings", {}).get("recent", {})
            forms = recent.get("form", [])
            accession_numbers = recent.get("accessionNumber", [])
            primary_docs = recent.get("primaryDocument", [])

            for i, form in enumerate(forms):
                if form == "10-K":
                    accession = accession_numbers[i].replace("-", "")
                    primary_doc = primary_docs[i]
                    return self.archives_url.format(int(cik), accession, primary_doc)
        except Exception as e:
            logger.error(f"Error fetching 10-K metadata for CIK {cik}: {e}", extra={"metadata": {"event": "sec_api_failure", "endpoint": "submissions", "error": str(e)}})
            raise e
        return None

    async def fetch_document(self, url: str) -> Optional[str]:
        try:
            logger.info(f"Fetching document from {url}", extra={"metadata": {"event": "outgoing_api_call", "target": "sec_archives"}})
            r = await self._get_with_retry(url)
            return r.text
        except Exception as e:
            logger.error(f"Error fetching document at {url}: {e}", extra={"metadata": {"event": "sec_api_failure", "endpoint": "archives", "error": str(e)}})
            raise e

sec_client = SECClient()

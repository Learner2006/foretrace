import re
import html
from typing import Optional
from fastapi import HTTPException
from app.clients.sec_client import sec_client
from app.clients.market_client import market_client
from app.utils.logger import logger

class SECService:
    @staticmethod
    def is_indian_ticker(ticker: str) -> bool:
        return ticker.upper().endswith(".NS") or ticker.upper().endswith(".BO")

    @staticmethod
    def extract_signal_text(raw_html: str) -> str:
        """
        Robust extraction using BeautifulSoup. Focuses on Item 1A and Item 7.
        """
        try:
            from bs4 import BeautifulSoup, XMLParsedAsHTMLWarning
            import warnings
            
            warnings.filterwarnings("ignore", category=XMLParsedAsHTMLWarning)
            soup = BeautifulSoup(raw_html, "lxml")
            
            # Remove scripts, styles, and tables (tables often contain huge XBRL data)
            for element in soup(["script", "style", "table"]):
                element.extract()
                
            text = soup.get_text(separator=' ')
            text = re.sub(r'\s+', ' ', text).strip()
            
            # Find the actual sections
            item1a_matches = list(re.finditer(r'\bItem\s+1A[\s\.\-\:]+Risk\s+Factors', text, re.IGNORECASE))
            item7_matches = list(re.finditer(r'\bItem\s+7[\s\.\-\:]+Management', text, re.IGNORECASE))
            
            def get_actual_section(matches, text_len):
                for m in matches:
                    start_pos = m.start()
                    # Skip the table of contents index
                    if start_pos < 15000 and text_len > 50000:
                        continue
                    return start_pos
                if matches:
                    return matches[-1].start() # Usually the last one if TOC was matched
                return None

            pos_1a = get_actual_section(item1a_matches, len(text))
            pos_7 = get_actual_section(item7_matches, len(text))
            
            extracted_parts = []
            if pos_1a is not None:
                # 12k chars captures the most material risks
                extracted_parts.append("RISK FACTORS: " + text[pos_1a:pos_1a + 12000])
                
            if pos_7 is not None:
                # 15k chars captures core MD&A narrative
                extracted_parts.append("MD&A: " + text[pos_7:pos_7 + 15000])

            if extracted_parts:
                combined = "\n\n".join(extracted_parts)
                return combined
                
            return text[15000:40000] # Fallback: skip TOC and return a chunk
        except Exception as e:
            logger.error(f"Error extracting signal text: {e}")
            return raw_html[:20000]

    async def fetch_company_filing(self, company_name: str, ticker: Optional[str]) -> str:
        if ticker and self.is_indian_ticker(ticker):
            logger.info(f"Fetching market data for Indian ticker: {ticker}")
            info = await market_client.get_ticker_info(ticker)
            if not info or "longName" not in info:
                raise HTTPException(status_code=404, detail="Indian company data not found via market provider")
            
            parts = []
            if info.get("longBusinessSummary"): parts.append(f"Business Summary: {info['longBusinessSummary']}")
            if info.get("sector"): parts.append(f"Sector: {info['sector']}")
            if info.get("industry"): parts.append(f"Industry: {info['industry']}")
            if info.get("totalRevenue"): parts.append(f"Total Revenue: {info['totalRevenue']:,}")
            if info.get("revenueGrowth"): parts.append(f"Revenue Growth: {info['revenueGrowth'] * 100:.1f}%")
            if info.get("profitMargins"): parts.append(f"Profit Margins: {info['profitMargins'] * 100:.1f}%")
            if info.get("debtToEquity"): parts.append(f"Debt to Equity: {info['debtToEquity']}")
            if info.get("returnOnEquity"): parts.append(f"Return on Equity: {info['returnOnEquity'] * 100:.1f}%")
            if info.get("fullTimeEmployees"): parts.append(f"Employees: {info['fullTimeEmployees']:,}")
            
            return "\n".join(parts)

        cik = None
        if ticker:
            cik = await sec_client.get_cik_by_ticker(ticker)

        if not cik:
            logger.info(f"Searching CIK by company name: {company_name}")
            cik = await sec_client.search_company_cik(company_name)

        if not cik:
            raise HTTPException(status_code=404, detail="Company not found in SEC EDGAR")

        logger.info(f"Fetching latest 10-K for CIK: {cik}")
        url = await sec_client.get_latest_10k_url(cik)
        if not url:
            raise HTTPException(status_code=404, detail="10-K filing metadata not found")

        raw_doc = await sec_client.fetch_document(url)
        if not raw_doc:
            raise HTTPException(status_code=404, detail="Could not retrieve 10-K document content")

        return self.extract_signal_text(raw_doc)

sec_service = SECService()

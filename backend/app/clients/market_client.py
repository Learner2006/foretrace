import asyncio
import yfinance as yf
from typing import Optional, Dict, Any
from app.utils.logger import logger

class MarketDataClient:
    async def get_ticker_info(self, ticker: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves company info from Yahoo Finance synchronously in a separate thread.
        """
        try:
            loop = asyncio.get_event_loop()
            info = await loop.run_in_executor(None, lambda: yf.Ticker(ticker).info)
            return info
        except Exception as e:
            logger.error(f"Failed to fetch market data for {ticker}: {e}")
            return None

market_client = MarketDataClient()

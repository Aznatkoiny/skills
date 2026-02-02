"""Data download and feature engineering for stock prediction."""
import yfinance as yf
import pandas as pd


def download_stock_data(ticker: str, period: str = "5y") -> pd.DataFrame:
    """Download stock data from Yahoo Finance.

    Args:
        ticker: Stock ticker symbol (e.g., 'SPY')
        period: Data period ('1mo', '1y', '5y', 'max')

    Returns:
        DataFrame with OHLCV data, DatetimeIndex, no NaN values
    """
    stock = yf.Ticker(ticker)
    df = stock.history(period=period)
    # Drop any rows with missing data
    df = df.dropna(subset=["Open", "High", "Low", "Close", "Volume"])
    return df

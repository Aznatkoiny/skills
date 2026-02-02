"""Tests for data module."""
import pytest
import pandas as pd
from stock_predictor.data import download_stock_data


class TestDownloadStockData:
    """Tests for download_stock_data function."""

    def test_returns_dataframe(self):
        """Should return a pandas DataFrame."""
        df = download_stock_data("SPY", period="1mo")
        assert isinstance(df, pd.DataFrame)

    def test_has_ohlcv_columns(self):
        """Should have Open, High, Low, Close, Volume columns."""
        df = download_stock_data("SPY", period="1mo")
        required = ["Open", "High", "Low", "Close", "Volume"]
        for col in required:
            assert col in df.columns, f"Missing column: {col}"

    def test_index_is_datetime(self):
        """Index should be DatetimeIndex."""
        df = download_stock_data("SPY", period="1mo")
        assert isinstance(df.index, pd.DatetimeIndex)

    def test_no_missing_values(self):
        """Should not have NaN values in OHLCV."""
        df = download_stock_data("SPY", period="1mo")
        ohlcv = df[["Open", "High", "Low", "Close", "Volume"]]
        assert not ohlcv.isna().any().any()

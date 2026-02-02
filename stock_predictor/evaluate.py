"""Evaluation utilities for stock predictor."""
import numpy as np
import keras


def naive_baseline(y_true: np.ndarray) -> float:
    """Calculate MAE for naive baseline (predict yesterday's price).

    Args:
        y_true: Array of true values in sequence order

    Returns:
        Mean Absolute Error of predicting y[t-1] for y[t]
    """
    # Predict yesterday's value for today
    y_pred = y_true[:-1]  # All but last
    y_actual = y_true[1:]  # All but first
    mae = np.mean(np.abs(y_actual - y_pred))
    return float(mae)


def evaluate_model(model: keras.Model, data: dict) -> dict:
    """Evaluate model on test data.

    Args:
        model: Trained Keras model
        data: Dict with X_test, y_test

    Returns:
        Dict with mse, mae, and predictions
    """
    X_test = data["X_test"]
    y_test = data["y_test"]

    # Get predictions
    predictions = model.predict(X_test, verbose=0).flatten()

    # Calculate metrics
    mse = float(np.mean((predictions - y_test) ** 2))
    mae = float(np.mean(np.abs(predictions - y_test)))

    return {
        "mse": mse,
        "mae": mae,
        "predictions": predictions,
        "y_test": y_test,
    }

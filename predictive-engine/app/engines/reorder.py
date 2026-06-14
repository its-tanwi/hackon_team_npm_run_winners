import pandas as pd
from datetime import datetime
import os

# Resolve the path to the synthetic data
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_PATH = os.path.join(BASE_DIR, "data", "synthetic_orders.csv")

def predict_user_cart(user_id: str, current_date=None):
    if current_date is None:
        current_date = pd.to_datetime('today')
    else:
        current_date = pd.to_datetime(current_date)
        
    try:
        df = pd.read_csv(DATA_PATH)
    except FileNotFoundError:
        return []

    df['order_date'] = pd.to_datetime(df['order_date'])

    # Filter history for the specific user
    user_df = df[df['user_id'] == user_id]
    if user_df.empty:
        return []

    predictions = []
    products = user_df['product_id'].unique()

    for prod in products:
        prod_df = user_df[user_df['product_id'] == prod].sort_values('order_date')
        if len(prod_df) < 2:
            continue # Skip items bought only once (no cycle to learn from)

        # Feature Engineering
        purchase_count = len(prod_df)
        last_purchase_date = prod_df['order_date'].iloc[-1]
        days_since_last = (current_date - last_purchase_date).days

        # Calculate average cycle
        prod_df['prev_order'] = prod_df['order_date'].shift(1)
        prod_df['cycle_days'] = (prod_df['order_date'] - prod_df['prev_order']).dt.days
        avg_cycle = prod_df['cycle_days'].mean()

        # Consumption Math (Inventory Depletion)
        # e.g., Cycle is 4 days, 3 days passed -> 25% remaining (0.25)
        remaining_inventory = max(0, 1 - (days_since_last / avg_cycle)) if avg_cycle > 0 else 1

        # Tiered Confidence Scoring
        confidence = 0
        if remaining_inventory <= 0.10:
            confidence = 95 # Almost empty -> Auto Add
        elif remaining_inventory <= 0.30:
            confidence = 75 # Getting low -> Suggest
        elif remaining_inventory <= 0.50:
            confidence = 50 # Half full -> Mild Suggestion
        else:
            confidence = 10 # Plenty left -> Hide

        # Explainable AI (XAI) text for the frontend
        rationale = f"Purchased {purchase_count} times. You buy this every {avg_cycle:.0f} days. "
        if remaining_inventory == 0:
            rationale += "Estimated inventory is empty."
        else:
            rationale += f"Estimated {remaining_inventory*100:.0f}% remaining."

        if confidence >= 50:
            predictions.append({
                "product_id": prod,
                "product_name": prod_df['product_name'].iloc[0],
                "category": prod_df['category'].iloc[0],
                "confidence": confidence,
                "rationale": rationale,
                "suggested_qty": int(prod_df['quantity'].mode().iloc[0])
            })

    # Sort by confidence highest to lowest
    return sorted(predictions, key=lambda x: x['confidence'], reverse=True)
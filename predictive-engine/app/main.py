from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from app.engines.reorder import predict_user_cart

app = FastAPI(title="Amazon Now Predictive Engine")

# Allow requests from your Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Change to your Next.js URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PredictedItem(BaseModel):
    product_id: str
    product_name: str
    category: str
    confidence: int
    rationale: str
    suggested_qty: int

class CartPredictionResponse(BaseModel):
    user_id: str
    auto_add: List[PredictedItem]
    suggestions: List[PredictedItem]

@app.get("/predict-cart/{user_id}", response_model=CartPredictionResponse)
def get_predicted_cart(user_id: str):
    predictions = predict_user_cart(user_id)

    if not predictions:
        raise HTTPException(status_code=404, detail="User not found or insufficient purchase history.")

    # Apply confidence thresholds for the UI
    auto_add = [p for p in predictions if p["confidence"] >= 90]
    suggestions = [p for p in predictions if 50 <= p["confidence"] < 90]

    return {
        "user_id": user_id,
        "auto_add": auto_add,
        "suggestions": suggestions
    }
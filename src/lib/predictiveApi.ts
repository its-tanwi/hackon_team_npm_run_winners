// src/lib/predictiveApi.ts

const PREDICTIVE_ENGINE_URL = "http://localhost:8001";

export interface PredictedItem {
    product_id: string;
    product_name: string;
    category: string;
    confidence: number;
    rationale: string;
    suggested_qty: number;
}

export interface CartPredictionResponse {
    user_id: string;
    auto_add: PredictedItem[];
    suggestions: PredictedItem[];
}

export const fetchSmartCart = async (userId: string): Promise<CartPredictionResponse> => {
    try {
        const res = await fetch(`${PREDICTIVE_ENGINE_URL}/predict-cart/${userId}`);
        if (!res.ok) {
            if (res.status === 404) {
                return { user_id: userId, auto_add: [], suggestions: [] };
            }
            throw new Error(`Predictive Engine returned ${res.status}`);
        }
        return await res.json();
    } catch (error) {
        console.error("Failed to fetch smart cart predictions:", error);
        // Fail gracefully so the rest of the app doesn't crash during the demo
        return { user_id: userId, auto_add: [], suggestions: [] };
    }
};
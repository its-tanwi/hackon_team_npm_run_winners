// src/components/amazon-now/SmartCart.tsx
import React, { useEffect, useState } from "react";
import { fetchSmartCart, CartPredictionResponse, PredictedItem } from "@/lib/predictiveApi";

// Note: For the hackathon demo, we are using a hardcoded User ID that has good synthetic data.
const DEMO_USER_ID = "U001"; 

export default function SmartCart() {
    const [data, setData] = useState<CartPredictionResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSmartCart(DEMO_USER_ID).then((res) => {
            setData(res);
            setLoading(false);
        });
    }, []);

    if (loading) {
        return <div className="p-4 animate-pulse bg-white rounded-lg mt-4 h-32">Loading Smart Cart...</div>;
    }

    if (!data || (data.auto_add.length === 0 && data.suggestions.length === 0)) {
        return null; 
    }

    const renderItem = (item: PredictedItem, isAutoAdd: boolean) => (
        <div key={item.product_id} className="flex justify-between items-center p-3 border-b border-gray-100 last:border-0">
            <div>
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{item.product_name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${isAutoAdd ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {item.confidence}% Match
                    </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{item.rationale}</p>
            </div>
            <button className="bg-amazon_yellow px-4 py-1.5 rounded-md text-sm font-medium hover:bg-yellow-500 transition-colors">
                Add {item.suggested_qty}
            </button>
        </div>
    );

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mt-6 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-900 to-amazon_blue p-4 text-white">
                <h2 className="text-lg font-bold flex items-center gap-2">
                    ✨ Your Zero-Click Smart Cart
                </h2>
                <p className="text-sm text-blue-100 mt-1">Based on your consumption rates and inventory depletion.</p>
            </div>

            <div className="p-4 grid md:grid-cols-2 gap-6">
                {/* Auto-Add Tier */}
                {data.auto_add.length > 0 && (
                    <div>
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Ready to Reorder</h3>
                        <div className="border border-gray-200 rounded-lg">
                            {data.auto_add.map(item => renderItem(item, true))}
                        </div>
                    </div>
                )}

                {/* Suggestions Tier */}
                {data.suggestions.length > 0 && (
                    <div>
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">You Might Also Need</h3>
                        <div className="border border-gray-200 rounded-lg">
                            {data.suggestions.map(item => renderItem(item, false))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
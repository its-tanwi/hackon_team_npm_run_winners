import React from "react";
import { LuShoppingBag } from "react-icons/lu";

interface Props {
    itemCount: number;
    total: number;
    freeDeliveryThreshold?: number;
}

const CartFooter = ({ itemCount, total, freeDeliveryThreshold = 149 }: Props) => {
    if (itemCount === 0) return null;

    const remaining = Math.max(0, freeDeliveryThreshold - total);

    return (
        <div className="fixed bottom-0 left-0 right-0 z-40 px-4 sm:px-6 lg:px-8 pb-4 pointer-events-none">
            <div className="max-w-screen-2xl mx-auto pointer-events-auto">
                {remaining > 0 && (
                    <div className="bg-white border border-gray-200 rounded-full mb-2 px-4 py-2 flex items-center gap-3 text-xs sm:text-sm shadow-sm w-fit mx-auto">
                        <LuShoppingBag className="text-gray-700 text-lg" />
                        <span className="text-gray-700">
                            Add items worth{" "}
                            <span className="font-bold text-gray-900">₹{remaining}</span> more to
                            get free delivery
                        </span>
                    </div>
                )}
                <div className="bg-[#0F1B2D] rounded-2xl px-4 sm:px-6 py-3 flex items-center justify-between shadow-lg">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amazon_yellow flex items-center justify-center">
                            <LuShoppingBag className="text-black text-lg" />
                        </div>
                        <div className="leading-tight">
                            <p className="text-white font-bold text-base sm:text-lg">₹{total}</p>
                            <p className="text-gray-300 text-xs">{itemCount} items</p>
                        </div>
                    </div>
                    <button className="bg-amazon_yellow text-black font-bold text-sm sm:text-base rounded-full px-6 sm:px-8 py-2.5 hover:brightness-95 transition">
                        Proceed
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CartFooter;

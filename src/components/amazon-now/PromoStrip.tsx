import React from "react";

const PromoStrip = () => {
    return (
        <div className="px-4 sm:px-6 lg:px-8 mt-4 grid grid-cols-1 mdl:grid-cols-3 gap-3">
            <div className="mdl:col-span-1 bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between">
                <div>
                    <p className="text-base font-semibold text-gray-900">
                        Get cashback{" "}
                        <span className="bg-[#3DD9F5] text-black px-1.5 py-0.5 rounded text-sm">
                            every time!
                        </span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        Save more on every order over ₹399 / ₹749
                    </p>
                </div>
                <div className="flex -space-x-3 shrink-0">
                    <div className="w-12 h-12 rounded-full bg-orange-200 border-2 border-white flex flex-col items-center justify-center text-[10px] font-bold text-orange-900">
                        <span>₹50</span>
                        <span className="text-[8px]">above ₹399</span>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-purple-200 border-2 border-white flex flex-col items-center justify-center text-[10px] font-bold text-purple-900">
                        <span>₹100</span>
                        <span className="text-[8px]">above ₹749</span>
                    </div>
                </div>
            </div>

            <div className="bg-gradient-to-r from-pink-600 to-rose-500 text-white rounded-2xl px-4 py-3 text-sm font-semibold shadow-sm flex items-center">
                Free delivery <span className="ml-1 font-bold">above ₹149</span>
            </div>
            <div className="bg-gradient-to-r from-pink-600 to-rose-500 text-white rounded-2xl px-4 py-3 text-sm font-semibold shadow-sm flex items-center">
                No handling fees <span className="ml-1 font-normal opacity-90">on all orders</span>
            </div>
        </div>
    );
};

export default PromoStrip;

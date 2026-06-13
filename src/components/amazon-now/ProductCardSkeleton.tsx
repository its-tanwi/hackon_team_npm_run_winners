import React from "react";

const ProductCardSkeleton = () => {
    return (
        <div className="bg-white rounded-2xl shadow-sm p-3 flex flex-col animate-pulse">
            <div className="w-full aspect-square bg-gray-200 rounded-xl mb-2" />
            <div className="h-3.5 bg-gray-200 rounded w-3/4 mb-1.5" />
            <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
            <div className="mt-auto pt-2 flex items-center justify-between">
                <div className="h-4 bg-gray-200 rounded w-12" />
                <div className="h-7 bg-gray-200 rounded-md w-12" />
            </div>
        </div>
    );
};

export default ProductCardSkeleton;

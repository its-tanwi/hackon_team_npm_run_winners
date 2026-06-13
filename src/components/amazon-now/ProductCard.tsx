import React from "react";
import Image from "next/image";

export type NowProduct = {
    id: string | number;
    title: string;
    weight: string;
    price: number;
    mrp: number;
    discountPct: number;
    image: string;
};

interface Props {
    product: NowProduct;
    onAdd?: (product: NowProduct) => void;
}

const ProductCard = ({ product, onAdd }: Props) => {
    return (
        <div className="bg-white rounded-2xl shadow-sm p-3 flex flex-col">
            <div className="relative w-full aspect-square bg-gray-50 rounded-xl overflow-hidden mb-2">
                {product.discountPct > 0 && (
                    <span className="absolute top-1 left-1 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md leading-tight">
                        {product.discountPct}%<br />OFF
                    </span>
                )}
                <Image
                    src={product.image}
                    alt={product.title}
                    fill
                    sizes="(max-width: 768px) 50vw, 200px"
                    className="object-contain p-2"
                />
            </div>

            <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-tight">
                {product.title}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{product.weight}</p>

            <div className="mt-auto pt-2 flex items-center justify-between">
                <div className="flex items-baseline gap-1.5">
                    <span className="text-base font-bold text-gray-900">₹{product.price}</span>
                    {product.mrp > product.price && (
                        <span className="text-xs text-gray-400 line-through">₹{product.mrp}</span>
                    )}
                </div>
                <button
                    onClick={() => onAdd?.(product)}
                    className="text-xs font-bold text-pink-600 border border-pink-600 rounded-md px-2.5 py-1 hover:bg-pink-50 transition"
                >
                    ADD
                </button>
            </div>
        </div>
    );
};

export default ProductCard;

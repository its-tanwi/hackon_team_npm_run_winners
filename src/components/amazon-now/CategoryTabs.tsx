import React from "react";

export type Category = {
    id: string;
    label: string;
    emoji: string;
};

export const CATEGORIES: Category[] = [
    { id: "top-picks", label: "Top Picks", emoji: "⭐" },
    { id: "masala-spices", label: "Masala, Sugar & Spices", emoji: "🧂" },
    { id: "oil-ghee", label: "Oil & Ghee", emoji: "🫒" },
    { id: "fruits-vegetables", label: "Fruits & Vegetables", emoji: "🥦" },
    { id: "atta-grains", label: "Atta, Rice & Grains", emoji: "🌾" },
    { id: "noodles-pasta", label: "Noodles & Pasta", emoji: "🍜" },
    { id: "chips-biscuits", label: "Chips & Biscuits", emoji: "🍪" },
    { id: "juices-drinks", label: "Juices & Cold Drinks", emoji: "🧃" },
    { id: "other", label: "Other Categories", emoji: "🛒" },
];

interface Props {
    activeId: string;
    onChange: (id: string) => void;
}

const CategoryTabs = ({ activeId, onChange }: Props) => {
    return (
        <div className="px-4 sm:px-6 lg:px-8 mt-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">Recommended for you</h2>
            <div className="flex gap-5 sm:gap-6 mdl:gap-8 overflow-x-auto pb-3 scrollbar-hide">
                {CATEGORIES.map((cat) => {
                    const isActive = cat.id === activeId;
                    return (
                        <button
                            key={cat.id}
                            onClick={() => onChange(cat.id)}
                            className="flex flex-col items-center min-w-[72px] focus:outline-none"
                        >
                            <div
                                className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl transition ${
                                    isActive
                                        ? "bg-blue-100 ring-2 ring-blue-400"
                                        : "bg-gray-100 hover:bg-gray-200"
                                }`}
                            >
                                {cat.emoji}
                            </div>
                            <span
                                className={`mt-2 text-xs text-center leading-tight ${
                                    isActive ? "font-semibold text-blue-700" : "text-gray-700"
                                }`}
                            >
                                {cat.label}
                            </span>
                            {isActive && (
                                <span className="mt-1 h-0.5 w-8 bg-blue-500 rounded-full" />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default CategoryTabs;

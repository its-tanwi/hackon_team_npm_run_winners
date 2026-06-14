import React, { useCallback, useEffect, useMemo, useState } from "react";
import Head from "next/head";
import NowHeader from "@/components/amazon-now/NowHeader";
import PromoStrip from "@/components/amazon-now/PromoStrip";
import CategoryTabs, { CATEGORIES } from "@/components/amazon-now/CategoryTabs";
import ProductCard, { NowProduct } from "@/components/amazon-now/ProductCard";
import ProductCardSkeleton from "@/components/amazon-now/ProductCardSkeleton";
import CartFooter from "@/components/amazon-now/CartFooter";
import AgentChat from "@/components/amazon-now/AgentChat";
import {
    fetchAmazonNowProducts,
    groupProductsByCategory,
} from "@/lib/amazonNowApi";

const AmazonNowPage = () => {
    const [activeCategory, setActiveCategory] = useState<string>(CATEGORIES[0].id);
    const [cart, setCart] = useState<Record<string, { product: NowProduct; qty: number }>>({});
    const [products, setProducts] = useState<NowProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);
        fetchAmazonNowProducts()
            .then((data) => {
                if (!cancelled) setProducts(data);
            })
            .catch((err) => {
                if (!cancelled) {
                    console.error("Amazon Now product fetch failed:", err);
                    setError("Couldn't load products. Please try again.");
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const productsByCategory = useMemo(
        () => groupProductsByCategory(products),
        [products]
    );

    const trimmedSearch = searchTerm.trim().toLowerCase();
    const isSearching = trimmedSearch.length > 0;

    const searchResults = useMemo(() => {
        if (!isSearching) return [] as NowProduct[];
        return products.filter((p) => p.title.toLowerCase().includes(trimmedSearch));
    }, [products, trimmedSearch, isSearching]);

    const visibleProducts = isSearching
        ? searchResults
        : productsByCategory[activeCategory] ?? [];

    const handleAdd = (p: NowProduct) => {
        setCart((prev) => {
            const key = String(p.id);
            const existing = prev[key];
            return {
                ...prev,
                [key]: { product: p, qty: existing ? existing.qty + 1 : 1 },
            };
        });
    };

    const handleAddBulk = useCallback(
        (lines: { product: NowProduct; qty: number }[]) => {
            setCart((prev) => {
                const next = { ...prev };
                lines.forEach(({ product, qty }) => {
                    const key = String(product.id);
                    const existing = next[key];
                    next[key] = {
                        product,
                        qty: existing ? existing.qty + qty : qty,
                    };
                });
                return next;
            });
        },
        []
    );

    const { itemCount, total } = useMemo(() => {
        const lines = Object.values(cart);
        return {
            itemCount: lines.reduce((sum, l) => sum + l.qty, 0),
            total: lines.reduce((sum, l) => sum + l.qty * l.product.price, 0),
        };
    }, [cart]);

    return (
        <>
            <Head>
                <title>Amazon Now · Quick Commerce</title>
            </Head>
            <main className="min-h-screen bg-gray-100 pb-32">
                <div className="max-w-screen-2xl mx-auto">
                    <NowHeader searchTerm={searchTerm} onSearchChange={setSearchTerm} />
                    {!isSearching && <AgentChat onAddProducts={handleAddBulk} />}
                    {!isSearching && <PromoStrip />}
                    {!isSearching && (
                        <CategoryTabs activeId={activeCategory} onChange={setActiveCategory} />
                    )}

                    {isSearching && !loading && !error && (
                        <div className="px-4 sm:px-6 lg:px-8 mt-6 flex items-baseline justify-between">
                            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                                {searchResults.length} result
                                {searchResults.length === 1 ? "" : "s"} for{" "}
                                <span className="text-pink-600">&quot;{searchTerm.trim()}&quot;</span>
                            </h2>
                            <button
                                onClick={() => setSearchTerm("")}
                                className="text-sm text-blue-600 hover:underline"
                            >
                                Clear
                            </button>
                        </div>
                    )}

                    <div className="px-4 sm:px-6 lg:px-8 mt-4 grid grid-cols-2 sm:grid-cols-3 mdl:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                        {loading &&
                            Array.from({ length: 8 }).map((_, i) => (
                                <ProductCardSkeleton key={`skeleton-${i}`} />
                            ))}

                        {!loading &&
                            !error &&
                            visibleProducts.map((p) => (
                                <ProductCard key={p.id} product={p} onAdd={handleAdd} />
                            ))}
                    </div>

                    {!loading && error && (
                        <div className="text-center mt-12 px-4">
                            <p className="text-red-600 font-medium mb-2">{error}</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="text-sm text-blue-600 underline"
                            >
                                Retry
                            </button>
                        </div>
                    )}

                    {!loading && !error && visibleProducts.length === 0 && (
                        <p className="text-center text-gray-500 mt-12 text-sm px-4">
                            {isSearching
                                ? `No products match "${searchTerm.trim()}". Try a different keyword.`
                                : "No products found in this category yet."}
                        </p>
                    )}

                    <CartFooter itemCount={itemCount} total={total} />
                </div>
            </main>
        </>
    );
};

export default AmazonNowPage;

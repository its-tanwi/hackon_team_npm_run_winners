import type { NowProduct } from "@/components/amazon-now/ProductCard";

const USD_TO_INR = 85;

const DUMMY_JSON_ENDPOINT =
    "https://dummyjson.com/products/category/groceries?limit=100";

interface DummyJsonProduct {
    id: number;
    title: string;
    description: string;
    price: number;
    discountPercentage: number;
    rating: number;
    stock: number;
    brand?: string;
    category: string;
    thumbnail: string;
    images: string[];
    weight?: number;
    tags?: string[];
}

interface DummyJsonResponse {
    products: DummyJsonProduct[];
    total: number;
    skip: number;
    limit: number;
}

const formatWeight = (weight: number | undefined): string => {
    if (!weight || weight <= 0) return "1 pack";
    if (weight >= 1000) return `${(weight / 1000).toFixed(1)} kg`;
    return `${weight} g`;
};

const toNowProduct = (p: DummyJsonProduct): NowProduct => {
    const inrPrice = Math.round(p.price * USD_TO_INR);
    const discountPct = Math.round(p.discountPercentage);
    const mrp =
        discountPct > 0
            ? Math.round(inrPrice / (1 - discountPct / 100))
            : inrPrice;

    return {
        id: p.id,
        title: p.title,
        weight: formatWeight(p.weight),
        price: inrPrice,
        mrp,
        discountPct,
        image: p.thumbnail,
    };
};

export const NOW_CATEGORY_RULES: Record<string, RegExp> = {
    "masala-spices": /\b(spice|salt|sugar|honey|masala)/i,
    "oil-ghee": /\b(oil|ghee|butter)/i,
    "fruits-vegetables":
        /\b(apple|banana|orange|kiwi|lemon|mulberry|strawberr|grape|mango|pineapple|melon|pear|peach|plum|berry|tomato|potato|onion|carrot|cucumber|cabbage|spinach|lettuce|broccoli|cauliflower|chili|chilli|pepper|fruit|vegetable|veggie|mushroom|garlic|ginger)/i,
    "atta-grains": /\b(rice|atta|wheat|grain|flour|oats|cereal)/i,
    "noodles-pasta": /\b(noodle|pasta|maggi|spaghetti|ramen)/i,
    "chips-biscuits": /\b(chip|biscuit|cookie|cracker|ice cream|chocolate|snack|wafer)/i,
    "juices-drinks": /\b(juice|drink|water|cola|coffee|tea|soda|beverage|smoothie|milkshake)/i,
};

export const categorizeProduct = (p: NowProduct): string[] => {
    const haystack = p.title.toLowerCase();
    const matched = Object.entries(NOW_CATEGORY_RULES)
        .filter(([, regex]) => regex.test(haystack))
        .map(([cat]) => cat);
    return matched.length > 0 ? matched : ["other"];
};

export const groupProductsByCategory = (
    products: NowProduct[]
): Record<string, NowProduct[]> => {
    const map: Record<string, NowProduct[]> = {
        "top-picks": [],
        "masala-spices": [],
        "oil-ghee": [],
        "fruits-vegetables": [],
        "atta-grains": [],
        "noodles-pasta": [],
        "chips-biscuits": [],
        "juices-drinks": [],
        other: [],
    };

    const byDiscount = [...products].sort((a, b) => b.discountPct - a.discountPct);
    map["top-picks"] = byDiscount.slice(0, 8);

    products.forEach((p) => {
        const cats = categorizeProduct(p);
        cats.forEach((catId) => {
            if (map[catId] && !map[catId].some((existing) => existing.id === p.id)) {
                map[catId].push(p);
            }
        });
    });

    return map;
};

export const fetchAmazonNowProducts = async (): Promise<NowProduct[]> => {
    const res = await fetch(DUMMY_JSON_ENDPOINT, {
        headers: { accept: "application/json" },
    });
    if (!res.ok) {
        throw new Error(`DummyJSON request failed: ${res.status}`);
    }
    const data: DummyJsonResponse = await res.json();
    return data.products.map(toNowProduct);
};

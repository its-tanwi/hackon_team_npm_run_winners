import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { RunCartAgentResponse, usdToInr } from "@/lib/agentApi";

interface Edit {
    id: number;
    quantity: number;
    rationale: string;
}

interface Props {
    open: boolean;
    response: RunCartAgentResponse | null;
    onClose: () => void;
    onConfirm: (edits: Edit[]) => void;
}

const MAX_QTY = 10;

const AgentResultModal = ({ open, response, onClose, onConfirm }: Props) => {
    const [edits, setEdits] = useState<Edit[]>([]);
    const [removed, setRemoved] = useState<Set<number>>(new Set());

    useEffect(() => {
        if (response) {
            setEdits(
                response.cart.items.map((i) => ({
                    id: i.id,
                    quantity: i.quantity,
                    rationale: i.rationale,
                }))
            );
            setRemoved(new Set());
        }
    }, [response]);

    const itemById = useMemo(() => {
        const map = new Map<number, RunCartAgentResponse["cart"]["items"][number]>();
        if (response) {
            for (const item of response.cart.items) map.set(item.id, item);
        }
        return map;
    }, [response]);

    const visibleEdits = useMemo(
        () => edits.filter((e) => !removed.has(e.id)),
        [edits, removed]
    );

    const totalInr = useMemo(() => {
        let total = 0;
        for (const edit of visibleEdits) {
            const item = itemById.get(edit.id);
            if (item) total += usdToInr(item.price) * edit.quantity;
        }
        return total;
    }, [visibleEdits, itemById]);

    const itemCount = visibleEdits.reduce((sum, e) => sum + e.quantity, 0);

    if (!open || !response) return null;

    const { cart, needs, matches } = response;

    const updateQty = (id: number, delta: number) => {
        setEdits((prev) =>
            prev.map((e) =>
                e.id === id
                    ? { ...e, quantity: Math.max(1, Math.min(MAX_QTY, e.quantity + delta)) }
                    : e
            )
        );
    };

    const removeItem = (id: number) => {
        setRemoved((prev) => {
            const next = new Set(prev);
            next.add(id);
            return next;
        });
    };

    const restoreItem = (id: number) => {
        setRemoved((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
    };

    const handleConfirm = () => {
        onConfirm(visibleEdits);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-amazon_blue/70 backdrop-blur-sm p-0 sm:p-4"
            onClick={onClose}
        >
            <div
                className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] overflow-hidden flex flex-col border border-amazon_blue/10"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="bg-amazon_blue text-white px-5 py-4 flex items-start gap-3">
                    <div className="relative w-10 h-10 rounded-md overflow-hidden bg-white ring-2 ring-amazon_yellow flex-shrink-0">
                        <Image
                            src="/amazon-now.png"
                            alt="Amazon Now"
                            fill
                            sizes="40px"
                            className="object-contain"
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[11px] uppercase tracking-wider text-amazon_yellow font-semibold">
                            Smart Cart Assistant
                        </p>
                        <h2 className="text-base sm:text-lg font-bold leading-tight mt-0.5">
                            Here&apos;s what I&apos;ve picked for you
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className="text-lightText hover:text-white text-2xl leading-none px-1 -mr-1 -mt-1"
                    >
                        ×
                    </button>
                </div>

                <div className="px-5 py-4 overflow-y-auto flex-1 bg-gray-50">
                    {cart.message && (
                        <div className="bg-white border-l-4 border-amazon_yellow rounded-md p-3 mb-4 shadow-sm">
                            <p className="text-sm text-amazon_blue leading-relaxed">
                                {cart.message}
                            </p>
                        </div>
                    )}

                    {edits.length > 0 ? (
                        <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xs font-bold uppercase tracking-wide text-amazon_light">
                                    Your cart ({itemCount} item{itemCount === 1 ? "" : "s"})
                                </h3>
                                <p className="text-xs text-gray-500">
                                    Tap −/+ to adjust • × to remove
                                </p>
                            </div>
                            <ul className="space-y-2">
                                {edits.map((edit) => {
                                    const item = itemById.get(edit.id);
                                    if (!item) return null;
                                    const isRemoved = removed.has(edit.id);
                                    return (
                                        <li
                                            key={edit.id}
                                            className={`bg-white rounded-lg border border-gray-200 p-3 transition ${
                                                isRemoved
                                                    ? "opacity-50 line-through"
                                                    : "hover:border-amazon_yellow/50"
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="relative w-12 h-12 bg-gray-50 rounded-md overflow-hidden flex-shrink-0">
                                                    <Image
                                                        src={item.image}
                                                        alt={item.title}
                                                        fill
                                                        sizes="48px"
                                                        className="object-contain p-1"
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-amazon_blue truncate">
                                                        {item.title}
                                                    </p>
                                                    <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                                                        {edit.rationale}
                                                    </p>
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    <p className="text-sm font-bold text-amazon_blue">
                                                        ₹{usdToInr(item.price) * edit.quantity}
                                                    </p>
                                                    <p className="text-[10px] text-gray-500">
                                                        ₹{usdToInr(item.price)} ea
                                                    </p>
                                                </div>
                                            </div>

                                            {!isRemoved ? (
                                                <div className="mt-2 flex items-center justify-between">
                                                    <div className="inline-flex items-center bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                                                        <button
                                                            onClick={() =>
                                                                updateQty(edit.id, -1)
                                                            }
                                                            disabled={edit.quantity <= 1}
                                                            aria-label="Decrease quantity"
                                                            className="w-8 h-8 flex items-center justify-center text-amazon_blue hover:bg-amazon_yellow disabled:opacity-40 disabled:hover:bg-gray-50 transition font-bold"
                                                        >
                                                            −
                                                        </button>
                                                        <span className="w-9 text-center text-sm font-bold text-amazon_blue">
                                                            {edit.quantity}
                                                        </span>
                                                        <button
                                                            onClick={() =>
                                                                updateQty(edit.id, +1)
                                                            }
                                                            disabled={edit.quantity >= MAX_QTY}
                                                            aria-label="Increase quantity"
                                                            className="w-8 h-8 flex items-center justify-center text-amazon_blue hover:bg-amazon_yellow disabled:opacity-40 disabled:hover:bg-gray-50 transition font-bold"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                    <button
                                                        onClick={() => removeItem(edit.id)}
                                                        className="text-xs text-gray-500 hover:text-red-600 transition px-2 py-1"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="mt-2 flex items-center justify-end">
                                                    <button
                                                        onClick={() => restoreItem(edit.id)}
                                                        className="text-xs font-semibold text-amazon_blue hover:text-amazon_light underline"
                                                    >
                                                        Undo remove
                                                    </button>
                                                </div>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ) : (
                        <div className="mb-4 text-sm text-gray-600 italic bg-white rounded-lg p-3">
                            I couldn&apos;t find anything in our catalog for this. See suggestions below.
                        </div>
                    )}

                    {cart.suggestions.length > 0 && (
                        <div className="mb-4 bg-amazon_yellow/15 border border-amazon_yellow rounded-lg p-3">
                            <h3 className="text-xs font-bold uppercase tracking-wide text-amazon_blue mb-1.5">
                                A few things we don&apos;t carry
                            </h3>
                            <ul className="text-sm text-amazon_blue space-y-1">
                                {cart.suggestions.map((s, idx) => (
                                    <li key={idx} className="leading-snug">
                                        • {s}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <details className="text-xs text-gray-500 mt-2 bg-white rounded-md p-2 border border-gray-200">
                        <summary className="cursor-pointer font-semibold text-amazon_light hover:text-amazon_blue">
                            How I figured this out
                        </summary>
                        <div className="mt-2 space-y-2">
                            <div>
                                <p className="font-semibold text-amazon_blue">
                                    Identified {needs.needs.length} need(s):
                                </p>
                                <ul className="mt-1 space-y-0.5">
                                    {needs.needs.map((n, i) => (
                                        <li key={i}>
                                            •{" "}
                                            <span className="font-mono text-amazon_light">
                                                {n.item}
                                            </span>{" "}
                                            ({n.category}) — {n.reason}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <p className="font-semibold text-amazon_blue">
                                    Matched {matches.matches.length}, unmatched{" "}
                                    {matches.unmatched_needs.length}.
                                </p>
                            </div>
                        </div>
                    </details>
                </div>

                <div className="border-t border-gray-200 px-5 py-3 bg-white flex items-center justify-between gap-3">
                    <div>
                        <p className="text-[11px] uppercase tracking-wide text-gray-500">
                            Estimated total
                        </p>
                        <p className="text-xl font-bold text-amazon_blue leading-tight">
                            ₹{totalInr}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="text-sm font-semibold text-amazon_light px-3 py-2 hover:underline"
                        >
                            Dismiss
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={visibleEdits.length === 0}
                            className="text-sm font-bold text-amazon_blue bg-amazon_yellow hover:brightness-95 active:brightness-90 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed rounded-lg px-4 py-2 transition shadow-sm border border-amazon_yellow"
                        >
                            Add {itemCount > 0 ? itemCount : ""} to cart
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgentResultModal;

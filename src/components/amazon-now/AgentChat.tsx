import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { runCartAgent, RunCartAgentResponse, AgentRequestError } from "@/lib/agentApi";
import AgentResultModal from "./AgentResultModal";
import { NowProduct } from "./ProductCard";
import { cartItemToNowProduct } from "@/lib/agentApi";

interface Props {
    onAddProducts: (items: { product: NowProduct; qty: number }[]) => void;
}

const SUGGESTIONS = [
    "I am sick, having fever",
    "Planning a movie night",
    "Need ingredients for breakfast",
    "Hosting friends this weekend",
];

type Status = "idle" | "loading" | "error";

const AgentChat = ({ onAddProducts }: Props) => {
    const [prompt, setPrompt] = useState("");
    const [status, setStatus] = useState<Status>("idle");
    const [error, setError] = useState<string | null>(null);
    const [response, setResponse] = useState<RunCartAgentResponse | null>(null);
    const [stage, setStage] = useState<string>("");
    const stageTimer = useRef<ReturnType<typeof setInterval> | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    useEffect(() => {
        return () => {
            if (stageTimer.current) clearInterval(stageTimer.current);
            abortRef.current?.abort();
        };
    }, []);

    const startStageAnimation = () => {
        const stages = [
            "Identifying what you need…",
            "Searching the catalog…",
            "Building your cart…",
        ];
        let i = 0;
        setStage(stages[0]);
        stageTimer.current = setInterval(() => {
            i = Math.min(i + 1, stages.length - 1);
            setStage(stages[i]);
        }, 4500);
    };

    const stopStageAnimation = () => {
        if (stageTimer.current) {
            clearInterval(stageTimer.current);
            stageTimer.current = null;
        }
        setStage("");
    };

    const submit = async (text: string) => {
        const trimmed = text.trim();
        if (!trimmed || status === "loading") return;

        setError(null);
        setStatus("loading");
        startStageAnimation();
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        try {
            const res = await runCartAgent(trimmed, controller.signal);
            setResponse(res);
            setStatus("idle");
        } catch (err) {
            const message =
                err instanceof AgentRequestError
                    ? err.message
                    : "Something went wrong. Please try again.";
            setError(message);
            setStatus("error");
        } finally {
            stopStageAnimation();
        }
    };

    const handleConfirm = (
        edits: { id: number; quantity: number; rationale: string }[]
    ) => {
        if (!response) return;
        const byId = new Map(response.cart.items.map((item) => [item.id, item]));
        const items = edits
            .map(({ id, quantity }) => {
                const item = byId.get(id);
                if (!item || quantity < 1) return null;
                return {
                    product: cartItemToNowProduct(item),
                    qty: quantity,
                };
            })
            .filter((x): x is { product: NowProduct; qty: number } => x !== null);

        if (items.length > 0) {
            onAddProducts(items);
        }
        setResponse(null);
        setPrompt("");
    };

    const handleClose = () => {
        setResponse(null);
    };

    return (
        <>
            <div className="px-4 sm:px-6 lg:px-8 mt-4">
                <div className="bg-white border border-amazon_blue/10 rounded-2xl shadow-sm overflow-hidden">
                    <div className="bg-amazon_blue text-white px-4 sm:px-5 py-3 flex items-center gap-3">
                        <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-md overflow-hidden bg-white ring-2 ring-amazon_yellow flex-shrink-0">
                            <Image
                                src="/amazon-now.png"
                                alt="Amazon Now"
                                fill
                                sizes="40px"
                                className="object-contain"
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm sm:text-base font-bold leading-tight">
                                Smart Cart{" "}
                                <span className="text-amazon_yellow">Assistant</span>
                            </p>
                            <p className="text-[11px] sm:text-xs text-lightText leading-tight mt-0.5">
                                Tell me the situation. I&apos;ll build the cart in seconds.
                            </p>
                        </div>
                    </div>

                    <div className="px-4 sm:px-5 py-4">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                submit(prompt);
                            }}
                            className="flex flex-col sm:flex-row gap-2"
                        >
                            <input
                                type="text"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="e.g. I'm sick, having fever"
                                disabled={status === "loading"}
                                className="flex-1 px-4 py-2.5 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amazon_yellow focus:border-transparent disabled:bg-gray-100"
                            />
                            <button
                                type="submit"
                                disabled={
                                    status === "loading" || prompt.trim().length === 0
                                }
                                className="px-5 py-2.5 text-sm font-bold text-amazon_blue bg-amazon_yellow hover:brightness-95 active:brightness-90 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed rounded-lg transition shrink-0 border border-amazon_yellow shadow-sm"
                            >
                                {status === "loading" ? "Thinking…" : "Build my cart"}
                            </button>
                        </form>

                        {status === "loading" && stage && (
                            <p className="mt-3 text-xs text-amazon_light flex items-center gap-2">
                                <span className="inline-block w-2 h-2 bg-amazon_yellow rounded-full animate-pulse" />
                                {stage}
                            </p>
                        )}

                        {status === "error" && error && (
                            <p className="mt-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2 leading-snug">
                                {error}
                            </p>
                        )}

                        {status !== "loading" && (
                            <div className="mt-3 flex flex-wrap gap-2">
                                {SUGGESTIONS.map((s) => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => {
                                            setPrompt(s);
                                            submit(s);
                                        }}
                                        className="text-xs text-amazon_blue bg-white border border-amazon_blue/20 hover:bg-amazon_yellow/20 hover:border-amazon_yellow rounded-full px-3 py-1 transition"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <AgentResultModal
                open={response !== null}
                response={response}
                onClose={handleClose}
                onConfirm={handleConfirm}
            />
        </>
    );
};

export default AgentChat;

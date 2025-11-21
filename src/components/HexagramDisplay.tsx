"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Sparkles, Loader2, BookOpen, Copy, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { DivinationResult } from "@/lib/meihua";

interface HexagramProps {
    lines: boolean[]; // true for Yang (—), false for Yin (-- --)
    name: string;
    position: "top" | "bottom";
}

function Trigram({ lines, name, position }: HexagramProps) {
    return (
        <div className={cn("flex flex-col gap-2 items-center", position === "top" ? "mb-1" : "mt-1")}>
            {lines.slice().reverse().map((isYang, idx) => (
                <div key={idx} className="w-24 h-4 flex justify-between">
                    {isYang ? (
                        <div className="w-full h-full bg-stone-800 rounded-sm" />
                    ) : (
                        <>
                            <div className="w-[45%] h-full bg-stone-800 rounded-sm" />
                            <div className="w-[45%] h-full bg-stone-800 rounded-sm" />
                        </>
                    )}
                </div>
            ))}
            <span className="text-stone-500 text-xs font-serif mt-1">{name}</span>
        </div>
    );
}

export default function HexagramDisplay({ result, question, onReset, onInterpretationComplete }: { result: DivinationResult; question: string; onReset: () => void; onInterpretationComplete?: (interpretation: string) => void }) {
    const [interpretation, setInterpretation] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = async () => {
        if (!interpretation) return;
        try {
            await navigator.clipboard.writeText(interpretation);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    const handleInterpret = async () => {
        const apiKey = localStorage.getItem("meihua_api_key");
        const baseUrl = localStorage.getItem("meihua_api_base_url") || "";
        const model = localStorage.getItem("meihua_api_model") || "";

        // Client-side key is optional now, server might have env vars
        // if (!apiKey) {
        //     setError("请先点击右上角设置按钮配置 API Key");
        //     return;
        // }

        setIsLoading(true);
        setError("");
        setInterpretation("");

        try {
            const prompt = `
        所问之事：${question || "未指定（请进行通用运势解读）"}
        
        【卦象数据】
        本卦：${result.main.upper.name}${result.main.lower.name} (上${result.main.upper.nature}/下${result.main.lower.nature})
        互卦：${result.mutual.upper.name}${result.mutual.lower.name} (上${result.mutual.upper.nature}/下${result.mutual.lower.nature})
        变卦：${result.changed.upper.name}${result.changed.lower.name} (上${result.changed.upper.nature}/下${result.changed.lower.nature})
        动爻：第${result.movingLine}爻

        【体用分析】
        体卦（自己）：${result.tiTrigram?.name} (五行属${result.tiWuxing})
        用卦（事物）：${result.yongTrigram?.name} (五行属${result.yongWuxing})
        
        请根据"体用五行生克"法，结合所问之事，为我详细解读。
      `;

            const response = await fetch("/api/interpret", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt, apiKey, baseUrl, model, stream: true }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "解读失败");
            }

            if (!response.body) return;

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let done = false;
            let fullInterpretation = "";

            while (!done) {
                const { value, done: doneReading } = await reader.read();
                done = doneReading;
                const chunkValue = decoder.decode(value);
                setInterpretation((prev) => prev + chunkValue);
                fullInterpretation += chunkValue;
            }

            if (onInterpretationComplete) {
                onInterpretationComplete(fullInterpretation);
            }

        } catch (err: any) {
            setError(err.message || "发生未知错误");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto mt-0 space-y-3 animate-in fade-in duration-700">
            {/* Question Display */}
            {question && (
                <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <h2 className="text-xl font-serif text-stone-600 mb-2">所问之事</h2>
                    <p className="text-2xl font-serif font-bold text-stone-800">{question}</p>
                </div>
            )}

            {/* Hexagrams Grid */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-stone-200 shadow-xl shadow-stone-200/50">
                <div className="flex flex-col items-center animate-in zoom-in-95 duration-700 delay-100 fill-mode-both">
                    <h3 className="text-stone-800 font-serif mb-4">本卦</h3>
                    <div className="flex flex-col bg-white p-3 rounded-lg shadow-sm border border-stone-100 relative">
                        {/* Ti/Yong Indicators for Main Hexagram */}
                        {result.tiTrigram && (
                            <>
                                <div className={cn(
                                    "absolute -left-8 text-xs font-serif px-2 py-1 rounded text-white",
                                    result.main.upper.id === result.tiTrigram.id && result.movingLine <= 3 ? "top-4 bg-stone-600" :
                                        result.main.lower.id === result.tiTrigram.id && result.movingLine > 3 ? "bottom-4 bg-stone-600" : "hidden"
                                )}>
                                    体
                                </div>
                                <div className={cn(
                                    "absolute -left-8 text-xs font-serif px-2 py-1 rounded text-white",
                                    result.main.upper.id === result.yongTrigram.id && result.movingLine > 3 ? "top-4 bg-stone-400" :
                                        result.main.lower.id === result.yongTrigram.id && result.movingLine <= 3 ? "bottom-4 bg-stone-400" : "hidden"
                                )}>
                                    用
                                </div>
                            </>
                        )}
                        <Trigram lines={result.main.upper.lines} name={result.main.upper.name} position="top" />
                        <Trigram lines={result.main.lower.lines} name={result.main.lower.name} position="bottom" />
                    </div>
                    <p className="mt-4 text-stone-600 font-serif text-lg">
                        {result.main.upper.name}{result.main.lower.name}
                        <span className="text-xs text-stone-400 ml-2 block text-center">
                            (上{result.main.upper.wuxing}/下{result.main.lower.wuxing})
                        </span>
                    </p>
                </div>

                <div className="flex flex-col items-center animate-in zoom-in-95 duration-700 delay-300 fill-mode-both">
                    <h3 className="text-stone-800 font-serif mb-4">互卦</h3>
                    <div className="flex flex-col bg-white p-3 rounded-lg shadow-sm border border-stone-100 opacity-70">
                        <Trigram lines={result.mutual.upper.lines} name={result.mutual.upper.name} position="top" />
                        <Trigram lines={result.mutual.lower.lines} name={result.mutual.lower.name} position="bottom" />
                    </div>
                    <p className="mt-4 text-stone-600 font-serif text-lg">
                        {result.mutual.upper.name}{result.mutual.lower.name}
                        <span className="text-xs text-stone-400 ml-2 block text-center">
                            (上{result.mutual.upper.wuxing}/下{result.mutual.lower.wuxing})
                        </span>
                    </p>
                </div>

                <div className="flex flex-col items-center animate-in zoom-in-95 duration-700 delay-500 fill-mode-both">
                    <h3 className="text-stone-800 font-serif mb-4">变卦</h3>
                    <div className="flex flex-col bg-white p-3 rounded-lg shadow-sm border border-stone-100">
                        <Trigram lines={result.changed.upper.lines} name={result.changed.upper.name} position="top" />
                        <Trigram lines={result.changed.lower.lines} name={result.changed.lower.name} position="bottom" />
                    </div>
                    <p className="mt-4 text-stone-600 font-serif text-lg">
                        {result.changed.upper.name}{result.changed.lower.name}
                        <span className="text-xs text-stone-400 ml-2 block text-center">
                            (上{result.changed.upper.wuxing}/下{result.changed.lower.wuxing})
                        </span>
                    </p>
                </div>
            </div>

            {/* AI Interpretation Section */}
            <div className="flex flex-col items-center gap-4 mt-4">
                {!interpretation && !isLoading && (
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleInterpret}
                            className="flex items-center gap-2 px-8 py-3 bg-stone-800 hover:bg-stone-700 text-white rounded-full shadow-lg hover:shadow-stone-800/20 transition-all duration-300 group animate-in fade-in slide-in-from-bottom-4 duration-700 delay-700 fill-mode-both"
                        >
                            <Sparkles className="w-4 h-4 group-hover:animate-pulse" />
                            <span>解卦</span>
                        </button>
                        <button
                            onClick={onReset}
                            className="flex items-center gap-2 px-8 py-3 bg-stone-800 hover:bg-stone-700 text-white rounded-full shadow-lg hover:shadow-stone-800/20 transition-all duration-300 group animate-in fade-in slide-in-from-bottom-4 duration-700 delay-700 fill-mode-both"
                        >
                            <span>重新起卦</span>
                        </button>
                    </div>
                )}

                {isLoading && (
                    <div className="flex items-center gap-3 text-stone-500 animate-pulse">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="font-serif">正在推演天机...</span>
                    </div>
                )}

                {error && (
                    <div className="text-red-500 bg-red-50 px-4 py-2 rounded-lg text-sm border border-red-100">
                        {error}
                    </div>
                )}

                {interpretation && (
                    <div className="w-full bg-white/80 backdrop-blur-sm rounded-xl border border-stone-200 p-8 shadow-lg animate-in slide-in-from-bottom-4 duration-700">
                        <div className="flex items-center justify-between mb-6 border-b border-stone-100 pb-4">
                            <div className="flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-stone-400" />
                                <h3 className="text-xl font-serif font-bold text-stone-800">卦象解读</h3>
                            </div>
                            <button
                                onClick={handleCopy}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-md transition-colors"
                                title="复制解读内容"
                            >
                                {isCopied ? (
                                    <>
                                        <Check className="w-4 h-4 text-green-600" />
                                        <span className="text-green-600">已复制</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4" />
                                        <span>复制</span>
                                    </>
                                )}
                            </button>
                        </div>
                        <div className="prose prose-stone max-w-none font-serif leading-loose text-stone-600">
                            <ReactMarkdown>{interpretation}</ReactMarkdown>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

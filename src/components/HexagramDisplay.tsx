"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Sparkles, Loader2, BookOpen, Copy, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { DivinationResult } from "@/lib/meihua";
import InterpretationModal from "./InterpretationModal";

interface HexagramProps {
    lines: boolean[]; // true for Yang (—), false for Yin (-- --)
    name: string;
    position: "top" | "bottom";
}

function Trigram({ lines, name, position }: HexagramProps) {
    return (
        <div className={cn("flex flex-col gap-1.5 md:gap-2 items-center", position === "top" ? "mb-0.5 md:mb-1" : "mt-0.5 md:mt-1")}>
            {lines.slice().reverse().map((isYang, idx) => (
                <div key={idx} className="w-16 md:w-24 h-3 md:h-4 flex justify-between">
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
            <span className="text-stone-500 text-[10px] md:text-xs font-serif mt-1">{name}</span>
        </div>
    );
}

export default function HexagramDisplay({ result, question, onReset, onInterpretationComplete }: { result: DivinationResult; question: string; onReset: () => void; onInterpretationComplete?: (interpretation: string) => void }) {
    const [interpretation, setInterpretation] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [error, setError] = useState("");

    const handleInterpret = async () => {
        if (interpretation) {
            setIsModalOpen(true);
            return;
        }

        const apiKey = localStorage.getItem("meihua_api_key");
        const baseUrl = localStorage.getItem("meihua_api_base_url") || "";
        const model = localStorage.getItem("meihua_api_model") || "";

        setIsLoading(true);
        setIsModalOpen(true); // Open modal immediately to show animation
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

            // Use stream: false for buffering on server/client side (simpler for this requirement)
            const response = await fetch("/api/interpret", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt, apiKey, baseUrl, model, stream: false }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "解读失败");
            }

            const data = await response.json();
            const fullInterpretation = data.choices?.[0]?.message?.content || "";

            setInterpretation(fullInterpretation);

            if (onInterpretationComplete) {
                onInterpretationComplete(fullInterpretation);
            }

        } catch (err: any) {
            setError(err.message || "发生未知错误");
            // Keep modal open but maybe show error state inside? 
            // For now, we might want to close it or show error in it.
            // Let's set interpretation to error message for simplicity in this version
            setInterpretation(`解读出错: ${err.message || "未知错误"}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in duration-700">
            <InterpretationModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                loading={isLoading}
                interpretation={interpretation}
                question={question}
            />

            {/* Question Display */}
            {question && (
                <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <h2 className="text-xl font-serif text-stone-600 mb-2">所问之事</h2>
                    <p className="text-2xl font-serif font-bold text-stone-800">{question}</p>
                </div>
            )}

            {/* Hexagrams Grid */}
            <div className="grid grid-cols-3 gap-2 md:gap-3 p-2 bg-white/50 backdrop-blur-sm rounded-xl border border-stone-200 shadow-xl shadow-stone-200/50">
                <div className="flex flex-col items-center animate-in zoom-in-95 duration-700 delay-100 fill-mode-both">
                    <h3 className="text-stone-800 font-serif mb-2 text-sm md:text-base">本卦</h3>
                    <div className="flex flex-col bg-white p-2 rounded-lg shadow-sm border border-stone-100 relative">
                        {/* Ti/Yong Indicators for Main Hexagram */}
                        {result.tiTrigram && (
                            <>
                                <div className={cn(
                                    "absolute -left-6 text-[10px] font-serif px-1.5 py-0.5 rounded text-white",
                                    result.main.upper.id === result.tiTrigram.id && result.movingLine <= 3 ? "top-3 bg-stone-600" :
                                        result.main.lower.id === result.tiTrigram.id && result.movingLine > 3 ? "bottom-3 bg-stone-600" : "hidden"
                                )}>
                                    体
                                </div>
                                <div className={cn(
                                    "absolute -left-6 text-[10px] font-serif px-1.5 py-0.5 rounded text-white",
                                    result.main.upper.id === result.yongTrigram.id && result.movingLine > 3 ? "top-3 bg-stone-400" :
                                        result.main.lower.id === result.yongTrigram.id && result.movingLine <= 3 ? "bottom-3 bg-stone-400" : "hidden"
                                )}>
                                    用
                                </div>
                            </>
                        )}
                        <Trigram lines={result.main.upper.lines} name={result.main.upper.name} position="top" />
                        <Trigram lines={result.main.lower.lines} name={result.main.lower.name} position="bottom" />
                    </div>
                    <p className="mt-2 text-stone-600 font-serif text-base">
                        {result.main.upper.name}{result.main.lower.name}
                        <span className="text-[10px] text-stone-400 ml-1 block text-center">
                            (上{result.main.upper.wuxing}/下{result.main.lower.wuxing})
                        </span>
                    </p>
                </div>

                <div className="flex flex-col items-center animate-in zoom-in-95 duration-700 delay-300 fill-mode-both">
                    <h3 className="text-stone-800 font-serif mb-2 text-sm md:text-base">互卦</h3>
                    <div className="flex flex-col bg-white p-2 rounded-lg shadow-sm border border-stone-100 opacity-70">
                        <Trigram lines={result.mutual.upper.lines} name={result.mutual.upper.name} position="top" />
                        <Trigram lines={result.mutual.lower.lines} name={result.mutual.lower.name} position="bottom" />
                    </div>
                    <p className="mt-2 text-stone-600 font-serif text-base">
                        {result.mutual.upper.name}{result.mutual.lower.name}
                        <span className="text-[10px] text-stone-400 ml-1 block text-center">
                            (上{result.mutual.upper.wuxing}/下{result.mutual.lower.wuxing})
                        </span>
                    </p>
                </div>

                <div className="flex flex-col items-center animate-in zoom-in-95 duration-700 delay-500 fill-mode-both">
                    <h3 className="text-stone-800 font-serif mb-2 text-sm md:text-base">变卦</h3>
                    <div className="flex flex-col bg-white p-2 rounded-lg shadow-sm border border-stone-100">
                        <Trigram lines={result.changed.upper.lines} name={result.changed.upper.name} position="top" />
                        <Trigram lines={result.changed.lower.lines} name={result.changed.lower.name} position="bottom" />
                    </div>
                    <p className="mt-2 text-stone-600 font-serif text-base">
                        {result.changed.upper.name}{result.changed.lower.name}
                        <span className="text-[10px] text-stone-400 ml-1 block text-center">
                            (上{result.changed.upper.wuxing}/下{result.changed.lower.wuxing})
                        </span>
                    </p>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col items-center gap-4 mt-6 md:mt-12">
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleInterpret}
                        className="flex items-center gap-2 px-8 py-3 bg-stone-800 hover:bg-stone-700 text-white rounded-full shadow-lg hover:shadow-stone-800/20 transition-all duration-300 group animate-in fade-in slide-in-from-bottom-4 duration-700 delay-700 fill-mode-both"
                    >
                        <Sparkles className="w-4 h-4 group-hover:animate-pulse" />
                        <span>{interpretation ? "查看解读" : "解卦"}</span>
                    </button>
                    <button
                        onClick={onReset}
                        className="flex items-center gap-2 px-8 py-3 bg-stone-800 hover:bg-stone-700 text-white rounded-full shadow-lg hover:shadow-stone-800/20 transition-all duration-300 group animate-in fade-in slide-in-from-bottom-4 duration-700 delay-700 fill-mode-both"
                    >
                        <span>重新起卦</span>
                    </button>
                </div>

                {error && !isModalOpen && (
                    <div className="text-red-500 bg-red-50 px-4 py-2 rounded-lg text-sm border border-red-100">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
}

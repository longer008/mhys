"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";
import type { DivinationResult } from "@/lib/meihua";
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
            const meta = result.meta;
            const lunar = meta?.lunar;
            const rawNumbers = meta?.rawNumbers;
            const wuxingRelation = result.wuxingRelation;

            const prompt = `
所问之事：${question || "未指定（请进行通用运势解读）"}

【程序计算结果｜事实，不得重算或替换】
以下内容均为程序已经计算出的事实。你只能解释这些结果，不得重新起卦、不得改动体卦/用卦/五行/体用关系/起卦时间/动爻，也不得用自己的算法替换。

【程序计算结果｜时间信息】
起卦方式：${meta?.method || "旧记录未保存"}
公历时间：${meta?.timeText || "旧记录未保存"}（时区：${meta?.timeZone || "旧记录未保存"}）
起卦时间戳：${meta?.generatedAt || "旧记录未保存"}
农历日期：${lunar ? `${lunar.month}月${lunar.day}日` : "旧记录未保存"}
农历干支：${lunar ? `${lunar.yearGanZhi || "未知"}年 ${lunar.monthGanZhi || "未知"}月 ${lunar.dayGanZhi || "未知"}日 ${lunar.timeGanZhi || "未知"}时` : "旧记录未保存"}
农历季节：${lunar?.season || "旧记录未保存"}
农历季节口径：${lunar?.seasonRule || "旧记录未保存"}
原始数字：上卦数=${rawNumbers?.num1 ?? "旧记录未保存"}，下卦数=${rawNumbers?.num2 ?? "旧记录未保存"}，动爻数=${rawNumbers?.num3 ?? "旧记录未保存"}，最终动爻=${rawNumbers?.movingLine ?? result.movingLine}

【程序计算结果｜卦象数据】
本卦：${result.main.name}（第${result.main.info.sequence}卦，${result.main.info.judgment}；上卦${result.main.upper.name}/${result.main.upper.nature}/五行${result.main.upper.wuxing}，下卦${result.main.lower.name}/${result.main.lower.nature}/五行${result.main.lower.wuxing}）
互卦：${result.mutual.name}（第${result.mutual.info.sequence}卦，${result.mutual.info.judgment}；上卦${result.mutual.upper.name}/${result.mutual.upper.nature}/五行${result.mutual.upper.wuxing}，下卦${result.mutual.lower.name}/${result.mutual.lower.nature}/五行${result.mutual.lower.wuxing}）
变卦：${result.changed.name}（第${result.changed.info.sequence}卦，${result.changed.info.judgment}；上卦${result.changed.upper.name}/${result.changed.upper.nature}/五行${result.changed.upper.wuxing}，下卦${result.changed.lower.name}/${result.changed.lower.nature}/五行${result.changed.lower.wuxing}）
动爻：第${result.movingLine}爻

【程序计算结果｜体用分析】
体卦（自己/求测者）：${result.tiTrigram?.name || "旧记录未保存"}（五行属${result.tiWuxing || "旧记录未保存"}）
用卦（事物/所问对象）：${result.yongTrigram?.name || "旧记录未保存"}（五行属${result.yongWuxing || "旧记录未保存"}）
体用关系参考：${wuxingRelation ? `${wuxingRelation.label}（${wuxingRelation.description}）。此项只作为体用五行的基础倾向参考，最终仍须结合本卦、互卦、变卦、动爻与所问之事综合判断。` : "旧记录未保存。若体卦、用卦、五行仍已给出，可只按已给事实谨慎说明；不得自行重算体用关系或替换既有体用。"}

【解读规则】
1. 程序计算结果优先。你只解释，不重算；不能推翻或替换上述体卦、用卦、五行、体用关系、起卦时间、动爻。
2. 五行体用关系只代表基础倾向，不是最终结论。最终解读必须结合本卦、互卦、变卦、动爻和所问之事；不得使用“程序定性为”“依程序初判”“不易之准绳”等机械表述。
3. 解读优先级必须按此顺序展开：体用五行 -> 本卦现状 -> 互卦过程/隐情 -> 变卦趋势 -> 动爻 -> 针对所问事项给建议。
4. 必须围绕所问之事，少空话，明确说明成败倾向、主要阻力、较合适的时机、可执行的行动建议。
5. 程序已经提供标准六十四卦名与卦序，必须使用这些卦名（如“水天需”“天水讼”），不得自行按上下卦组合另造“坎乾卦”“乾坎卦”等名称。
6. 若时间、农历、meta 或体用关系为“旧记录未保存”，只能说明信息缺失并基于已给事实谨慎解释，不得改用当前时间重新计算。
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

        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "未知错误";
            setError(message || "发生未知错误");
            // Keep modal open but maybe show error state inside? 
            // For now, we might want to close it or show error in it.
            // Let's set interpretation to error message for simplicity in this version
            setInterpretation(`解读出错: ${message || "未知错误"}`);
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
                        {result.main.name}
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
                        {result.mutual.name}
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
                        {result.changed.name}
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

"use client";

import { useState } from "react";
import { CircleDot, RotateCcw } from "lucide-react";
import { Lunar } from "lunar-javascript";
import type { DivinationResult } from "@/lib/meihua";
import type { DivinationRequestContext } from "@/features/divination/types";
import { cn } from "@/lib/utils";
import { fetchApi } from "@/lib/api-client";
import { saveHistoryRecord } from "@/lib/history";
import { getCustomAiConfig } from "@/lib/ai-settings";
import InterpretationModal from "./InterpretationModal";

interface HexagramProps {
    lines: boolean[]; // true 为阳爻，false 为阴爻
    name: string;
    position: "top" | "bottom";
    role?: "体" | "用";
}

function Trigram({ lines, name, position, role }: HexagramProps) {
    const positionName = position === "top" ? "上卦" : "下卦";

    return (
        <div className="grid grid-cols-[2rem_auto_3rem] items-center justify-center gap-2 sm:gap-3">
            <div className="flex justify-end">
                {role && (
                    <span
                        className={cn(
                            "grid size-7 place-items-center border font-song text-xs",
                            role === "体"
                                ? "border-stone-500/55 bg-stone-800 text-stone-50"
                                : "border-[var(--cinnabar)]/55 text-[var(--cinnabar)]"
                        )}
                        title={role === "体" ? "体卦：代表自身" : "用卦：代表所问之事"}
                    >
                        {role}
                    </span>
                )}
            </div>
            <div role="img" aria-label={`${positionName}${name}`} className="flex flex-col items-center gap-1.5">
                {lines.slice().reverse().map((isYang, index) => (
                    <div key={index} className="flex h-2.5 w-20 justify-between sm:h-3 sm:w-24" aria-hidden="true">
                        {isYang ? (
                            <span className="h-full w-full rounded-[1px] bg-stone-800" />
                        ) : (
                            <>
                                <span className="h-full w-[44%] rounded-[1px] bg-stone-800" />
                                <span className="h-full w-[44%] rounded-[1px] bg-stone-800" />
                            </>
                        )}
                    </div>
                ))}
            </div>
            <div className="font-ui-cn text-xs leading-5 text-stone-500">
                <span className="block text-[10px] tracking-[0.12em] text-stone-400">{positionName}</span>
                <span className="block font-medium text-stone-700">{name}</span>
            </div>
        </div>
    );
}

interface HexagramStageProps {
    sequence: string;
    title: string;
    phase: string;
    hexagram: DivinationResult["main"];
    upperRole?: "体" | "用";
    lowerRole?: "体" | "用";
    movingLine?: number;
    isLast?: boolean;
}

function HexagramStage({
    sequence,
    title,
    phase,
    hexagram,
    upperRole,
    lowerRole,
    movingLine,
    isLast = false,
}: HexagramStageProps) {
    return (
        <article
            className={cn(
                "relative flex min-w-0 flex-col px-4 py-7 sm:px-7 md:px-5 md:py-8",
                !isLast && "border-b border-stone-300/80 md:border-r md:border-b-0"
            )}
        >
            <header className="mb-7 flex items-start justify-between gap-4">
                <div>
                    <p className="font-ui-cn text-[10px] font-medium tracking-[0.24em] text-stone-400">
                        {sequence} · {phase}
                    </p>
                    <h3 className="mt-2 font-song text-xl font-semibold tracking-[0.12em] text-stone-900">
                        {title}
                    </h3>
                </div>
                {movingLine && (
                    <span className="border-l border-[var(--cinnabar)]/60 pl-3 font-ui-cn text-xs leading-5 text-[var(--cinnabar)]">
                        第{movingLine}爻<br />发动
                    </span>
                )}
            </header>

            <div className="flex flex-1 flex-col justify-center gap-4">
                <Trigram lines={hexagram.upper.lines} name={hexagram.upper.name} position="top" role={upperRole} />
                <div className="mx-auto h-px w-28 bg-stone-200 sm:w-32" aria-hidden="true" />
                <Trigram lines={hexagram.lower.lines} name={hexagram.lower.name} position="bottom" role={lowerRole} />
            </div>

            <footer className="mt-7 border-t border-stone-200 pt-4 text-center">
                <p className="font-song text-lg font-semibold tracking-[0.1em] text-stone-800">
                    {hexagram.name}
                </p>
                <p className="mt-1 font-ui-cn text-[11px] tracking-[0.08em] text-stone-400">
                    上属{hexagram.upper.wuxing} · 下属{hexagram.lower.wuxing}
                </p>
            </footer>

            {!isLast && (
                <span
                    aria-hidden="true"
                    className="absolute -bottom-3 left-1/2 z-10 grid size-6 -translate-x-1/2 place-items-center bg-[#fdfbf7] font-ui-cn text-sm text-[var(--cinnabar)] md:-right-3 md:bottom-auto md:left-auto md:top-1/2 md:-translate-y-1/2 md:translate-x-0"
                >
                    <span className="md:hidden">↓</span>
                    <span className="hidden md:inline">→</span>
                </span>
            )}
        </article>
    );
}

function getLunarSeason(month: number): "春" | "夏" | "秋" | "冬" | "未知" {
    const normalizedMonth = Math.abs(month);
    if (normalizedMonth >= 1 && normalizedMonth <= 3) return "春";
    if (normalizedMonth >= 4 && normalizedMonth <= 6) return "夏";
    if (normalizedMonth >= 7 && normalizedMonth <= 9) return "秋";
    if (normalizedMonth >= 10 && normalizedMonth <= 12) return "冬";
    return "未知";
}

interface HexagramDisplayProps {
    result: DivinationResult;
    question: string;
    requestContext: DivinationRequestContext;
    onReset: () => void;
    aiInterpretationEnabled?: boolean;
    allowCustomAi?: boolean;
}

export default function HexagramDisplay({
    result,
    question,
    requestContext,
    onReset,
    aiInterpretationEnabled = true,
    allowCustomAi = true,
}: HexagramDisplayProps) {
    const [interpretation, setInterpretation] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [error, setError] = useState("");

    const handleInterpret = async () => {
        if (interpretation) {
            setIsModalOpen(true);
            return;
        }
        if (!aiInterpretationEnabled) {
            setError("本站暂未开放 AI 解卦");
            return;
        }

        setIsLoading(true);
        setIsModalOpen(true);
        setError("");
        setInterpretation("");

        try {
            // 解读必须使用起卦时刻，不能在用户点击“解卦”时重新取当前时间。
            const generatedAt = new Date(requestContext.generatedAt);
            const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "local";
            const lunar = Lunar.fromDate(generatedAt);
            const lunarMonth = lunar.getMonth();
            const lunarDay = lunar.getDay();
            const lunarSeason = getLunarSeason(lunarMonth);
            const aiConfig = allowCustomAi ? getCustomAiConfig() : null;

            const data = await fetchApi<{ recordId: string; interpretation: string }>("/api/interpret", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    clientRequestId: requestContext.clientRequestId,
                    question: requestContext.question,
                    method: requestContext.method,
                    numbers: requestContext.numbers,
                    timeContext: {
                        occurredAt: generatedAt.toISOString(),
                        timeZone,
                        lunarMonth,
                        lunarDay,
                        season: lunarSeason,
                    },
                    aiConfig: aiConfig || undefined,
                }),
            });
            const fullInterpretation = data.interpretation;

            setInterpretation(fullInterpretation);
            saveHistoryRecord({
                id: data.recordId,
                createdAt: new Date().toISOString(),
                question,
                result,
                interpretation: fullInterpretation,
            });
        } catch (caughtError: unknown) {
            const message = caughtError instanceof Error ? caughtError.message : "发生未知错误";
            setError(message);
            setIsModalOpen(false);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section
            aria-labelledby="hexagram-result-title"
            className="mx-auto w-full max-w-5xl space-y-7"
        >
            <InterpretationModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                loading={isLoading}
                interpretation={interpretation}
                question={question}
            />

            {/* 问题独立成题，避免与卦盘争夺视觉焦点。 */}
            {question && (
                <header className="border-l-2 border-[var(--cinnabar)] px-4 py-1 sm:px-6">
                    <p className="font-ui-cn text-[10px] font-medium tracking-[0.26em] text-[var(--cinnabar)]">所问之事</p>
                    <h2 id="hexagram-result-title" className="mt-3 max-w-3xl break-words font-song text-2xl font-semibold leading-relaxed tracking-[0.06em] text-stone-900 sm:text-3xl">
                        {question}
                    </h2>
                </header>
            )}

            {/* 一块连续纸面承载三阶段，移动端纵向阅读，桌面端横向推演。 */}
            <div className="grid grid-cols-1 overflow-hidden border-y border-border bg-card/55 md:grid-cols-3">
                <HexagramStage
                    sequence="一"
                    title="本卦"
                    phase="本象"
                    hexagram={result.main}
                    upperRole={result.movingLine <= 3 ? "体" : "用"}
                    lowerRole={result.movingLine <= 3 ? "用" : "体"}
                    movingLine={result.movingLine}
                />
                <HexagramStage
                    sequence="二"
                    title="互卦"
                    phase="中势"
                    hexagram={result.mutual}
                />
                <HexagramStage
                    sequence="三"
                    title="变卦"
                    phase="之变"
                    hexagram={result.changed}
                    isLast
                />
            </div>

            {/* 主操作使用朱砂实色，次操作退为描边，保持明确层级。 */}
            <div className="flex flex-col gap-3 border-t border-stone-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-ui-cn text-xs leading-6 text-stone-500">
                    <span className="mr-3 inline-flex items-center gap-1.5"><span aria-hidden="true" className="size-2 bg-stone-800" />体为自身</span>
                    <span className="inline-flex items-center gap-1.5"><span aria-hidden="true" className="size-2 border border-[var(--cinnabar)]" />用为所问</span>
                </p>
                <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
                    <button
                        type="button"
                        onClick={handleInterpret}
                        disabled={isLoading || (!aiInterpretationEnabled && !interpretation)}
                        className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-sm bg-[var(--cinnabar)] px-5 font-ui-cn text-sm font-medium tracking-[0.08em] text-white shadow-[0_8px_22px_-14px_rgba(80,35,35,0.85)] transition-[transform,background-color,box-shadow] duration-200 hover:bg-[#743434] hover:shadow-[0_10px_26px_-14px_rgba(80,35,35,0.95)] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cinnabar)]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fdfbf7] disabled:cursor-not-allowed disabled:opacity-55"
                    >
                        <CircleDot className="size-4" aria-hidden="true" />
                        <span>{isLoading
                            ? "推演中……"
                            : interpretation
                                ? "查看解读"
                                : aiInterpretationEnabled
                                    ? "解卦"
                                    : "解卦暂未开放"}</span>
                    </button>
                    <button
                        type="button"
                        onClick={onReset}
                        className="inline-flex min-h-11 items-center justify-center rounded-sm border border-stone-300 bg-transparent px-5 font-ui-cn text-sm font-medium tracking-[0.08em] text-stone-700 transition-[transform,border-color,background-color,color] duration-200 hover:border-stone-500 hover:bg-stone-100/70 hover:text-stone-900 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-500/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fdfbf7]"
                    >
                        <RotateCcw className="size-4" aria-hidden="true" />
                        重新起卦
                    </button>
                </div>
            </div>

            {error && !isModalOpen && (
                <div role="alert" aria-live="assertive" className="border-l-2 border-[var(--cinnabar)] bg-[var(--cinnabar)]/[0.04] px-4 py-3 font-ui-cn text-sm leading-6 text-[var(--cinnabar)]">
                    <p className="font-medium">解读未完成</p>
                    <p className="mt-0.5 text-xs opacity-85">
                        {error}
                    </p>
                </div>
            )}
        </section>
    );
}

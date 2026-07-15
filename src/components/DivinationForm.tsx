"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { CircleDot, Clock, Minus, Plus, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { DivinationMethod, DivinationSubmission } from "@/features/divination/types";

interface DivinationFormProps {
    onComplete: (submission: DivinationSubmission) => void;
    onStepChange?: (step: 1 | 2) => void;
    enabledMethods?: DivinationMethod[];
    defaultMethod?: DivinationMethod;
    maxQuestionLength?: number;
    noticeText?: string;
}

const MAX_DIVINATION_NUMBER = 999_999_999;
const DEFAULT_METHODS: DivinationMethod[] = ["manual", "random", "time"];

const METHOD_OPTIONS: Array<{ value: DivinationMethod; label: string }> = [
    { value: "manual", label: "一念取数" },
    { value: "random", label: "随数成卦" },
    { value: "time", label: "依时成卦" },
];

export default function DivinationForm({
    onComplete,
    onStepChange,
    enabledMethods = DEFAULT_METHODS,
    defaultMethod = "manual",
    maxQuestionLength = 500,
    noticeText = "无事不占 · 不动不占 · 诚心静气",
}: DivinationFormProps) {
    const [question, setQuestion] = useState("");
    const [num1, setNum1] = useState("");
    const [num2, setNum2] = useState("");
    const [num3, setNum3] = useState("");
    const [method, setMethod] = useState<DivinationMethod>(defaultMethod);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const previousDefaultMethod = useRef(defaultMethod);

    useEffect(() => {
        const nextMethod = enabledMethods.includes(defaultMethod)
            ? defaultMethod
            : enabledMethods[0] || "manual";
        const defaultChanged = previousDefaultMethod.current !== defaultMethod;
        previousDefaultMethod.current = defaultMethod;
        setMethod((currentMethod) =>
            defaultChanged || !enabledMethods.includes(currentMethod)
                ? nextMethod
                : currentMethod
        );
    }, [defaultMethod, enabledMethods]);

    const updateNumber = (value: string, setter: (nextValue: string) => void, amount: number) => {
        const currentValue = Number(value);
        const nextValue = Number.isInteger(currentValue) ? currentValue + amount : 1;
        setter(String(Math.min(MAX_DIVINATION_NUMBER, Math.max(1, nextValue))));
        if (error) setError("");
    };

    const validateAndStart = (
        n1: number,
        n2: number,
        n3: number,
        method: DivinationMethod,
        movingLine?: number,
        generatedAt: Date = new Date()
    ) => {
        const normalizedQuestion = question.trim();
        if (!normalizedQuestion) {
            setError("请先输入您想问的事情");
            return;
        }
        if (normalizedQuestion.length > maxQuestionLength) {
            setError(`问题不能超过 ${maxQuestionLength} 个字符`);
            return;
        }
        const numbers = [n1, n2, n3];
        if (numbers.some((value) => !Number.isInteger(value) || value < 1 || value > MAX_DIVINATION_NUMBER)) {
            setError(`三个数字必须是 1 至 ${MAX_DIVINATION_NUMBER} 之间的整数`);
            return;
        }
        setError("");
        startDivination({
            question: normalizedQuestion,
            method,
            numbers: { num1: n1, num2: n2, num3: n3, movingLine },
            generatedAt: generatedAt.toISOString(),
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (method === "random") {
            handleRandom();
            return;
        }
        if (method === "time") {
            handleTime();
            return;
        }

        if (!num1 || !num2 || !num3) {
            setError("请完整输入三个数字");
            return;
        }
        // 手动起卦不额外传动爻，由三个数字之和推算。
        validateAndStart(Number(num1), Number(num2), Number(num3), "manual");
    };

    const startDivination = (submission: DivinationSubmission) => {
        setIsSubmitting(true);
        setTimeout(() => {
            onComplete(submission);
            setIsSubmitting(false);
        }, 1000);
    };

    const handleMethodChange = (nextMethod: DivinationMethod) => {
        setMethod(nextMethod);
        setError("");
        onStepChange?.(question.trim() ? 2 : 1);
    };

    const handleRandom = () => {
        if (!question.trim()) {
            setError("请先输入您想问的事情");
            return;
        }
        const generatedAt = new Date();
        const r1 = Math.floor(Math.random() * 100) + 1;
        const r2 = Math.floor(Math.random() * 100) + 1;
        const r3 = Math.floor(Math.random() * 100) + 1;
        setNum1(r1.toString());
        setNum2(r2.toString());
        setNum3(r3.toString());
        validateAndStart(r1, r2, r3, "random", undefined, generatedAt);
    };

    const handleTime = () => {
        if (!question.trim()) {
            setError("请先输入您想问的事情");
            return;
        }
        import("@/lib/meihua").then(({ generateTimeBasedNumbers }) => {
            const { num1: t1, num2: t2, num3: t3, movingLine, generatedAt } = generateTimeBasedNumbers();
            setNum1(t1.toString());
            setNum2(t2.toString());
            setNum3(t3.toString());
            validateAndStart(t1, t2, t3, "time", movingLine, generatedAt);
        });
    };

    return (
        <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            aria-labelledby="divination-form-title"
            className="mx-auto w-full max-w-xl rounded-sm border border-border/90 bg-card/90 px-4 py-7 shadow-[0_24px_60px_-40px_rgba(58,49,39,0.6)] sm:px-7 sm:py-9"
        >
            <header className="mb-8 flex items-start justify-between gap-6 border-l-2 border-[var(--cinnabar)] pl-4 sm:pl-5">
                <div>
                    <p className="mb-2 font-ui-cn text-[11px] font-medium tracking-[0.28em] text-[var(--cinnabar)]">
                        观物取象
                    </p>
                    <h2 id="divination-form-title" className="font-song text-3xl font-semibold tracking-[0.12em] text-foreground sm:text-4xl">
                        诚心起卦
                    </h2>
                    <p className="mt-3 font-ui-cn text-sm leading-6 tracking-[0.08em] text-muted-foreground">
                        {noticeText}
                    </p>
                </div>
                <span aria-hidden="true" className="mt-1 grid size-10 shrink-0 place-items-center border border-[var(--cinnabar)]/45 font-song text-sm text-[var(--cinnabar)]">
                    诚
                </span>
            </header>

            <form onSubmit={handleSubmit} className="space-y-8" aria-busy={isSubmitting}>
                <div className="space-y-3">
                    <div className="flex items-baseline justify-between gap-4">
                        <Label htmlFor="question" className="font-ui-cn text-sm font-medium tracking-[0.08em] text-foreground">
                            所问何事 <span aria-hidden="true" className="text-[var(--cinnabar)]">*</span>
                        </Label>
                        <span className="font-ui-cn text-[11px] tracking-[0.08em] text-muted-foreground">请具体、诚实地描述</span>
                    </div>
                    <textarea
                        id="question"
                        value={question}
                        onChange={(e) => {
                            setQuestion(e.target.value);
                            if (error) setError("");
                            onStepChange?.(e.target.value.trim() ? 2 : 1);
                        }}
                        aria-invalid={Boolean(error)}
                        aria-describedby={error ? "question-error" : undefined}
                        disabled={isSubmitting}
                        maxLength={maxQuestionLength}
                        className={cn(
                            "flex min-h-28 w-full resize-none rounded-sm border bg-card/55 px-4 py-3 font-kai text-lg leading-8 text-foreground outline-none placeholder:text-muted-foreground",
                            "transition-[border-color,box-shadow,background-color] duration-200 focus-visible:border-ring focus-visible:bg-card/80 focus-visible:ring-2 focus-visible:ring-ring/25 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                            "disabled:cursor-not-allowed disabled:opacity-55",
                            error ? "border-[var(--cinnabar)]/70 ring-1 ring-[var(--cinnabar)]/15" : "border-input"
                        )}
                        placeholder="心中默念所问之事……"
                    />
                    <div className="flex justify-end font-ui-cn text-[11px] leading-5 text-muted-foreground">
                        <span className="shrink-0 tabular-nums">{question.length}/{maxQuestionLength}</span>
                    </div>
                    <div id="question-error" role="alert" aria-live="polite" className="min-h-5">
                        {error && (
                            <motion.p
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2 }}
                                className="border-l-2 border-[var(--cinnabar)] pl-3 font-ui-cn text-xs leading-5 text-[var(--cinnabar)]"
                            >
                                {error}
                            </motion.p>
                        )}
                    </div>
                </div>

                <fieldset className="space-y-4">
                    <legend className="font-ui-cn text-sm font-medium tracking-[0.08em] text-foreground">起卦方式</legend>
                    <div
                        className={cn(
                            "grid gap-1 border border-border/80 bg-muted/45 p-1",
                            enabledMethods.length === 1
                                ? "grid-cols-1"
                                : enabledMethods.length === 2
                                    ? "grid-cols-2"
                                    : "grid-cols-3"
                        )}
                        aria-label="起卦方式"
                    >
                        {METHOD_OPTIONS.filter((option) => enabledMethods.includes(option.value)).map((option) => {
                            const isSelected = method === option.value;

                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    aria-pressed={isSelected}
                                    disabled={isSubmitting}
                                    onClick={() => handleMethodChange(option.value)}
                                    className={cn(
                                        "h-10 border-b-2 px-2 font-ui-cn text-xs transition-[background-color,border-color,color,box-shadow] duration-200",
                                        isSelected
                                            ? "border-[var(--cinnabar)] bg-card text-foreground shadow-[0_4px_12px_-10px_rgba(58,49,39,0.7)]"
                                            : "border-transparent text-muted-foreground hover:bg-card/65 hover:text-foreground"
                                    )}
                                >
                                    {option.label}
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex h-[9.5rem] flex-col justify-center">
                    {method === "manual" ? (
                        <div className="space-y-4 border-t border-border/70 pt-4">
                            <div className="flex items-center justify-between gap-3 border-l-2 border-[var(--cinnabar)]/35 pl-3">
                                <p className="shrink-0 font-ui-cn text-sm text-foreground">一念取三数</p>
                                <p className="whitespace-nowrap text-right font-ui-cn text-[11px] tracking-[0.04em] text-[var(--cinnabar)]/80">
                                    心随意动
                                </p>
                            </div>
                            <div className="grid grid-cols-3 gap-2 sm:gap-4">
                                {[
                                    { id: "num1", label: "上卦数", value: num1, setter: setNum1 },
                                    { id: "num2", label: "下卦数", value: num2, setter: setNum2 },
                                    { id: "num3", label: "动爻数", value: num3, setter: setNum3 },
                                ].map((field) => (
                                    <div key={field.id} className="space-y-2">
                                        <Label htmlFor={field.id} className="font-ui-cn text-sm text-muted-foreground">{field.label}</Label>
                                        <div className="relative">
                                            <Input
                                                id={field.id}
                                                type="number"
                                                inputMode="numeric"
                                                min={1}
                                                max={MAX_DIVINATION_NUMBER}
                                                step={1}
                                                value={field.value}
                                                onChange={(e) => {
                                                    field.setter(e.target.value);
                                                    if (error) setError("");
                                                }}
                                                placeholder="数字"
                                                disabled={isSubmitting}
                                                className="h-14 appearance-none rounded-sm border-input bg-transparent pr-11 text-center font-mono text-xl tabular-nums shadow-none transition-[border-color,box-shadow,background-color] duration-200 placeholder:font-ui-cn placeholder:text-sm focus-visible:border-ring focus-visible:bg-card/60 focus-visible:ring-ring/25 focus-visible:ring-offset-background [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                                                required={!isSubmitting}
                                            />
                                            <div className="absolute inset-y-1 right-1 flex w-7 flex-col overflow-hidden border-l border-border/70">
                                                <button
                                                    type="button"
                                                    aria-label={`增加${field.label}`}
                                                    disabled={isSubmitting}
                                                    onClick={() => updateNumber(field.value, field.setter, 1)}
                                                    className="grid flex-1 place-items-center text-muted-foreground/75 transition-colors hover:bg-secondary hover:text-foreground focus-visible:z-10 focus-visible:outline-none"
                                                >
                                                    <Plus className="size-3" aria-hidden="true" />
                                                </button>
                                                <button
                                                    type="button"
                                                    aria-label={`减少${field.label}`}
                                                    disabled={isSubmitting}
                                                    onClick={() => updateNumber(field.value, field.setter, -1)}
                                                    className="grid flex-1 place-items-center text-muted-foreground/75 transition-colors hover:bg-secondary hover:text-foreground focus-visible:z-10 focus-visible:outline-none"
                                                >
                                                    <Minus className="size-3" aria-hidden="true" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="border border-border/70 bg-secondary/35 px-4 py-4 sm:px-5 sm:py-5">
                            <div className="flex items-center gap-3">
                                {method === "random" ? (
                                    <Shuffle className="mt-0.5 size-4 shrink-0 text-[var(--cinnabar)]" aria-hidden="true" />
                                ) : (
                                    <Clock className="mt-0.5 size-4 shrink-0 text-[var(--cinnabar)]" aria-hidden="true" />
                                )}
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-5">
                                        <p className="shrink-0 font-ui-cn text-sm font-medium text-foreground">
                                            {method === "random" ? "随数成卦" : "依时成卦"}
                                        </p>
                                        <p className="font-ui-cn text-xs leading-5 text-muted-foreground sm:text-right">
                                        {method === "random"
                                            ? "由随机之数，观当下之象。"
                                            : "依当下时刻，排定一卦。"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    </div>
                </fieldset>

                <div className="space-y-3 border-t border-border/70 pt-6">
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="h-[3.25rem] w-full rounded-sm bg-[var(--cinnabar)] font-song text-base tracking-[0.2em] text-stone-50 shadow-[0_8px_24px_-14px_rgba(80,35,35,0.75)] transition-[transform,background-color,box-shadow] duration-200 hover:bg-[var(--cinnabar-deep)] hover:shadow-[0_10px_28px_-14px_rgba(80,35,35,0.9)] active:translate-y-px focus-visible:ring-2 focus-visible:ring-[var(--cinnabar)]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                        {isSubmitting ? (
                            <span aria-live="polite">推演中……</span>
                        ) : (
                            <>
                                {method === "manual" ? (
                                    <CircleDot className="size-4" aria-hidden="true" />
                                ) : method === "random" ? (
                                    <Shuffle className="size-4" aria-hidden="true" />
                                ) : (
                                    <Clock className="size-4" aria-hidden="true" />
                                )}
                                {method === "manual" ? "一念取数" : method === "random" ? "随数成卦" : "依时成卦"}
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </motion.section>
    );
}

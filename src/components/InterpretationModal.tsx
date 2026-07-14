"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toPng } from "html-to-image";
import { Check, Copy, Eye, ImageDown } from "lucide-react";
import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import DivinationAnimation from "./DivinationAnimation";
import { cn } from "@/lib/utils";

interface InterpretationModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    loading: boolean;
    interpretation: string;
    question: string;
}

const INTERPRETATION_NOTICE = "注：易理可参，世事在人。卦象所示仅为传统易理视角，旨在提供思考与启发，不代表现实结果或必然走向。";

export default function InterpretationModal({
    open,
    onOpenChange,
    loading,
    interpretation,
    question,
}: InterpretationModalProps) {
    const [isCopied, setIsCopied] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [exportError, setExportError] = useState("");
    const interpretationContentRef = useRef<HTMLDivElement>(null);
    const exportContentRef = useRef<HTMLDivElement>(null);
    const interpretationScrollRef = useRef<HTMLDivElement>(null);

    const handleCopy = async () => {
        if (!interpretation) return;
        try {
            const plainText = interpretationContentRef.current?.innerText.trim()
                || interpretationContentRef.current?.textContent?.trim()
                || "";
            if (!plainText) return;
            await navigator.clipboard.writeText(plainText);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    const handleExport = async () => {
        if (!interpretation || isExporting) return;

        const exportNode = exportContentRef.current;
        const interpretationScrollNode = interpretationScrollRef.current;
        if (!exportNode || !interpretationScrollNode) return;

        const originalStyles = {
            exportHeight: exportNode.style.height,
            exportMaxHeight: exportNode.style.maxHeight,
            exportFlex: exportNode.style.flex,
            exportOverflow: exportNode.style.overflow,
            contentHeight: interpretationScrollNode.style.height,
            contentMaxHeight: interpretationScrollNode.style.maxHeight,
            contentFlex: interpretationScrollNode.style.flex,
            contentOverflowY: interpretationScrollNode.style.overflowY,
        };

        setIsExporting(true);
        setExportError("");

        try {
            await document.fonts.ready;

            interpretationScrollNode.style.height = `${interpretationScrollNode.scrollHeight}px`;
            interpretationScrollNode.style.maxHeight = "none";
            interpretationScrollNode.style.flex = "none";
            interpretationScrollNode.style.overflowY = "visible";
            exportNode.style.height = "auto";
            exportNode.style.maxHeight = "none";
            exportNode.style.flex = "none";
            exportNode.style.overflow = "visible";

            await new Promise<void>((resolve) => {
                requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
            });

            const bounds = exportNode.getBoundingClientRect();
            const dataUrl = await toPng(exportNode, {
                backgroundColor: "#f3f1eb",
                width: Math.ceil(bounds.width),
                height: Math.ceil(exportNode.scrollHeight),
                pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
                skipFonts: true,
            });
            const imageBlob = await fetch(dataUrl).then((response) => response.blob());
            const now = new Date();
            const dateText = [
                now.getFullYear(),
                String(now.getMonth() + 1).padStart(2, "0"),
                String(now.getDate()).padStart(2, "0"),
            ].join("");
            const downloadLink = document.createElement("a");
            downloadLink.download = `卦象解读-${dateText}.png`;
            const imageUrl = URL.createObjectURL(imageBlob);
            downloadLink.href = imageUrl;
            downloadLink.click();
            URL.revokeObjectURL(imageUrl);
        } catch (error) {
            console.error("Failed to export interpretation image:", error);
            setExportError("图片导出失败，请稍后重试");
        } finally {
            exportNode.style.height = originalStyles.exportHeight;
            exportNode.style.maxHeight = originalStyles.exportMaxHeight;
            exportNode.style.flex = originalStyles.exportFlex;
            exportNode.style.overflow = originalStyles.exportOverflow;
            interpretationScrollNode.style.height = originalStyles.contentHeight;
            interpretationScrollNode.style.maxHeight = originalStyles.contentMaxHeight;
            interpretationScrollNode.style.flex = originalStyles.contentFlex;
            interpretationScrollNode.style.overflowY = originalStyles.contentOverflowY;
            setIsExporting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="frontend-theme interpretation-theme !bg-background flex max-h-[82dvh] max-w-2xl flex-col gap-0 p-0">
                <div ref={exportContentRef} className="frontend-theme interpretation-theme flex min-h-0 flex-1 flex-col bg-background">
                <DialogHeader className="shrink-0 border-b border-border px-6 py-5 pr-16">
                    <div className="mb-2 flex items-center gap-2 text-xs font-medium tracking-[0.18em] text-[var(--cinnabar)]">
                        <Eye className="h-4 w-4" aria-hidden="true" />
                        观象释义
                    </div>
                    <DialogTitle className="text-2xl">
                        {loading ? "正在解卦" : "卦象解读"}
                    </DialogTitle>
                </DialogHeader>

                <div
                    ref={interpretationScrollRef}
                    className={cn("relative min-h-72 flex-1 bg-card p-5 sm:p-6", loading ? "flex items-center justify-center overflow-hidden" : "overflow-y-auto")}
                    aria-live="polite"
                    aria-busy={loading}
                >
                    {loading ? (
                        <div className="flex h-full w-full items-center justify-center">
                            <DivinationAnimation />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {question && (
                                <div className="border-l-2 border-[var(--cinnabar)] bg-muted/45 px-4 py-3">
                                    <p className="mb-1 text-xs tracking-[0.14em] text-muted-foreground">所问之事</p>
                                    <p className="text-base font-medium leading-7 text-foreground">{question}</p>
                                </div>
                            )}

                            <div ref={interpretationContentRef} className="prose prose-stone max-w-none leading-8 text-foreground prose-headings:font-semibold prose-headings:text-foreground prose-p:text-foreground/85 prose-strong:text-foreground">
                                <ReactMarkdown>{interpretation}</ReactMarkdown>
                                <p className="not-prose mt-6 border-t border-border pt-4 text-xs italic leading-6 text-muted-foreground">
                                    {INTERPRETATION_NOTICE}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
                </div>

                {!loading && (
                    <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/25 p-4">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            关闭
                        </Button>
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                onClick={handleCopy}
                                className={cn(
                                    "order-2",
                                    isCopied && "bg-[var(--jade)] hover:bg-[var(--jade)]"
                                )}
                            >
                            {isCopied ? (
                                <>
                                    <Check aria-hidden="true" />
                                    已复制
                                </>
                            ) : (
                                <>
                                    <Copy aria-hidden="true" />
                                    复制解读
                                </>
                            )}
                            </Button>
                        <Button
                            type="button"
                            variant="outline"
                            className="order-1"
                            onClick={handleExport}
                            disabled={isExporting}
                        >
                            <ImageDown aria-hidden="true" />
                            {isExporting ? "生成图片中……" : "导出图片"}
                        </Button>
                        </div>
                        {exportError && (
                            <p role="alert" aria-live="polite" className="basis-full text-right text-xs text-[var(--cinnabar)]">
                                {exportError}
                            </p>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

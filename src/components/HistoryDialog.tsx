import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { ChevronDown, ChevronUp, History, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    clearHistory,
    deleteRecord,
    getHistory,
    type DivinationRecord,
} from "@/lib/history";
import { getStandardHexagramName } from "@/lib/meihua";

interface HistoryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    triggerRef?: React.RefObject<HTMLButtonElement | null>;
}

export function HistoryDialog({ open, onOpenChange, triggerRef }: HistoryDialogProps) {
    const [history, setHistory] = useState<DivinationRecord[]>([]);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        if (!open) return;

        const frameId = window.requestAnimationFrame(() => {
            setHistory(getHistory());
        });

        return () => {
            window.cancelAnimationFrame(frameId);
        };
    }, [open]);

    const handleClear = () => {
        if (confirm("确定要清空所有占卜记录吗？")) {
            clearHistory();
            setHistory([]);
            setExpandedId(null);
        }
    };

    const handleDelete = (event: React.MouseEvent, id: string) => {
        event.stopPropagation();
        if (confirm("确定要删除这条记录吗？")) {
            const deleted = deleteRecord(id);
            if (deleted) {
                setHistory((previous) => previous.filter((record) => record.id !== id));
                setExpandedId((previous) => previous === id ? null : previous);
            }
        }
    };

    const toggleExpand = (id: string) => {
        setExpandedId((previous) => previous === id ? null : id);
    };

    const formatDate = (createdAt: string) => {
        return new Date(createdAt).toLocaleString("zh-CN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="frontend-theme flex max-h-[82dvh] max-w-2xl flex-col p-0"
                onCloseAutoFocus={(event) => {
                    if (!triggerRef?.current) return;
                    event.preventDefault();
                    triggerRef.current.focus();
                }}
            >
                <DialogHeader className="border-b border-border px-6 py-5 pr-16">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="mb-2 flex items-center gap-2 text-xs font-medium tracking-[0.18em] text-[var(--cinnabar)]">
                                <History className="h-4 w-4" aria-hidden="true" />
                                往期占验
                            </div>
                            <DialogTitle className="text-2xl">占卜历史</DialogTitle>
                            <DialogDescription className="mt-2">
                                展开记录可查看完整解读。
                            </DialogDescription>
                        </div>
                        {history.length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleClear}
                                className="shrink-0 text-destructive hover:text-destructive"
                            >
                                <Trash2 aria-hidden="true" />
                                清空
                            </Button>
                        )}
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
                    {history.length === 0 ? (
                        <div className="grid min-h-64 place-items-center border border-dashed border-border bg-muted/30 px-6 text-center">
                            <div>
                                <History className="mx-auto mb-4 h-8 w-8 text-[var(--cinnabar)]/60" aria-hidden="true" />
                                <p className="font-medium text-foreground">暂无占卜记录</p>
                                <p className="mt-2 text-sm text-muted-foreground">完成一次解卦后，记录会显示在这里。</p>
                            </div>
                        </div>
                    ) : (
                        <div className="divide-y divide-border border-y border-border">
                            {history.map((record) => {
                                const isExpanded = expandedId === record.id;
                                return (
                                    <article key={record.id}>
                                        <div className="flex items-start gap-3 py-4">
                                            <button
                                                type="button"
                                                className="min-w-0 flex-1 rounded-sm text-left"
                                                onClick={() => toggleExpand(record.id)}
                                                aria-expanded={isExpanded}
                                                aria-controls={`history-detail-${record.id}`}
                                            >
                                                <div className="space-y-1.5">
                                                    <time className="tabular-nums text-xs tracking-[0.08em] text-muted-foreground">
                                                        {formatDate(record.createdAt)}
                                                    </time>
                                                    <h3 className="font-medium leading-6 text-foreground">{record.question || "无问题"}</h3>
                                                    <div className="text-sm text-muted-foreground">
                                                        <span className="text-foreground">
                                                            {getStandardHexagramName(record.result.main.upper, record.result.main.lower)}
                                                        </span>
                                                        <span className="mx-2 text-[var(--cinnabar)]">→</span>
                                                        <span className="text-foreground">
                                                            {getStandardHexagramName(record.result.changed.upper, record.result.changed.lower)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </button>
                                            <div className="flex shrink-0 items-center gap-1">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={(event) => handleDelete(event, record.id)}
                                                    className="text-muted-foreground hover:text-destructive"
                                                    aria-label={`删除记录：${record.question || "无问题"}`}
                                                >
                                                    <Trash2 aria-hidden="true" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => toggleExpand(record.id)}
                                                    aria-label={isExpanded ? "收起解读" : "展开解读"}
                                                    aria-expanded={isExpanded}
                                                    aria-controls={`history-detail-${record.id}`}
                                                >
                                                    {isExpanded ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
                                                </Button>
                                            </div>
                                        </div>

                                        {isExpanded && (
                                            <div id={`history-detail-${record.id}`} className="mb-5 border-l-2 border-[var(--cinnabar)]/45 bg-muted/35 px-4 py-4">
                                                <div className="prose prose-stone max-w-none text-sm">
                                                    <h4 className="mb-2 font-medium text-foreground">解卦结果</h4>
                                                    <div className="leading-7 text-muted-foreground">
                                                        <ReactMarkdown>{record.interpretation}</ReactMarkdown>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

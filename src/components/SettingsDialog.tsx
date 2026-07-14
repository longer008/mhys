"use client";

import { useState } from "react";
import { RotateCcw, Save, Settings } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    clearCustomAiConfig,
    getCustomAiConfig,
    saveCustomAiConfig,
} from "@/lib/ai-settings";

export default function SettingsDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const [baseUrl, setBaseUrl] = useState("");
    const [apiKey, setApiKey] = useState("");
    const [model, setModel] = useState("");
    const [error, setError] = useState("");

    const handleOpenChange = (open: boolean) => {
        if (open) {
            const config = getCustomAiConfig();
            setBaseUrl(config?.baseUrl || "");
            setApiKey(config?.apiKey || "");
            setModel(config?.model || "");
            setError("");
        }
        setIsOpen(open);
    };

    const handleSave = () => {
        const normalizedBaseUrl = baseUrl.trim();
        const normalizedApiKey = apiKey.trim();
        const normalizedModel = model.trim();

        if (!normalizedBaseUrl && !normalizedApiKey && !normalizedModel) {
            clearCustomAiConfig();
            setIsOpen(false);
            return;
        }
        if (!normalizedBaseUrl || !normalizedApiKey || !normalizedModel) {
            setError("请完整填写 API 地址、API Key 和模型名称");
            return;
        }

        let parsedUrl: URL;
        try {
            parsedUrl = new URL(normalizedBaseUrl);
        } catch {
            setError("API 地址格式无效");
            return;
        }
        if (parsedUrl.protocol !== "https:") {
            setError("API 地址必须使用 HTTPS");
            return;
        }

        saveCustomAiConfig({
            baseUrl: normalizedBaseUrl.replace(/\/+$/, ""),
            apiKey: normalizedApiKey,
            model: normalizedModel,
        });
        setError("");
        setIsOpen(false);
    };

    const handleReset = () => {
        clearCustomAiConfig();
        setBaseUrl("");
        setApiKey("");
        setModel("");
        setError("");
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <button
                    type="button"
                    className="inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                    aria-label="API 设置"
                >
                    <Settings className="h-4 w-4" aria-hidden="true" />
                    <span className="hidden sm:inline">设置</span>
                </button>
            </DialogTrigger>

            <DialogContent className="frontend-theme max-w-md">
                <DialogHeader className="border-b border-border pb-5 pr-10">
                    <div className="mb-2 text-xs font-medium tracking-[0.2em] text-[var(--cinnabar)]">解读服务</div>
                    <DialogTitle className="text-2xl">API 设置</DialogTitle>
                    <DialogDescription>
                        留空使用站点默认服务。
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 py-2">
                    <div className="space-y-2">
                        <label htmlFor="api-base-url" className="text-sm font-medium text-foreground">
                            API 地址
                        </label>
                        <Input
                            id="api-base-url"
                            type="url"
                            value={baseUrl}
                            onChange={(event) => setBaseUrl(event.target.value)}
                            placeholder="https://api.openai.com/v1"
                            autoComplete="url"
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="api-key" className="text-sm font-medium text-foreground">
                            API Key
                        </label>
                        <Input
                            id="api-key"
                            type="password"
                            value={apiKey}
                            onChange={(event) => setApiKey(event.target.value)}
                            placeholder="sk-..."
                            autoComplete="off"
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="api-model" className="text-sm font-medium text-foreground">
                            模型名称
                        </label>
                        <Input
                            id="api-model"
                            type="text"
                            value={model}
                            onChange={(event) => setModel(event.target.value)}
                            placeholder="gpt-4.1-mini"
                            autoComplete="off"
                        />
                    </div>
                    <div role="alert" aria-live="polite" className="min-h-5 text-xs text-destructive">
                        {error}
                    </div>
                </div>

                <DialogFooter className="mt-2 gap-2 sm:justify-between sm:space-x-0">
                    <Button type="button" variant="ghost" onClick={handleReset}>
                        <RotateCcw aria-hidden="true" />
                        使用默认
                    </Button>
                    <Button type="button" onClick={handleSave}>
                        <Save aria-hidden="true" />
                        保存
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

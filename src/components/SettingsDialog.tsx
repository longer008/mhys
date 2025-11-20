"use client";

import { useState, useEffect } from "react";
import { Settings, X } from "lucide-react";

export default function SettingsDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const [baseUrl, setBaseUrl] = useState("https://api.openai.com/v1");
    const [apiKey, setApiKey] = useState("");
    const [model, setModel] = useState("gpt-3.5-turbo");

    useEffect(() => {
        const storedBaseUrl = localStorage.getItem("meihua_api_base_url");
        const storedApiKey = localStorage.getItem("meihua_api_key");
        const storedModel = localStorage.getItem("meihua_api_model");
        if (storedBaseUrl) setBaseUrl(storedBaseUrl);
        if (storedApiKey) setApiKey(storedApiKey);
        if (storedModel) setModel(storedModel);
    }, []);

    const handleSave = () => {
        localStorage.setItem("meihua_api_base_url", baseUrl);
        localStorage.setItem("meihua_api_key", apiKey);
        localStorage.setItem("meihua_api_model", model);
        setIsOpen(false);
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="fixed top-4 right-4 p-2 text-stone-400 hover:text-stone-600 transition-colors z-50"
                title="设置 API"
            >
                <Settings className="w-6 h-6" />
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-6 m-4 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-serif font-bold text-stone-800">API 设置</h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-stone-400 hover:text-stone-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-stone-600 mb-1">
                                    API Base URL
                                </label>
                                <input
                                    type="text"
                                    value={baseUrl}
                                    onChange={(e) => setBaseUrl(e.target.value)}
                                    className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400/50"
                                    placeholder="https://api.openai.com/v1"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-600 mb-1">
                                    API Key
                                </label>
                                <input
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400/50"
                                    placeholder="sk-..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-600 mb-1">
                                    Model Name
                                </label>
                                <input
                                    type="text"
                                    value={model}
                                    onChange={(e) => setModel(e.target.value)}
                                    className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400/50"
                                    placeholder="gpt-3.5-turbo"
                                />
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end gap-3">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="px-4 py-2 text-sm text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 text-sm bg-stone-800 text-white hover:bg-stone-700 rounded-lg transition-colors shadow-lg shadow-stone-800/20"
                            >
                                保存配置
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

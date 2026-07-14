export interface CustomAiConfig {
    baseUrl: string;
    apiKey: string;
    model: string;
}

const STORAGE_KEYS = {
    baseUrl: "meihua_api_base_url",
    apiKey: "meihua_api_key",
    model: "meihua_api_model",
} as const;

export function getCustomAiConfig(): CustomAiConfig | null {
    if (typeof window === "undefined") return null;

    const baseUrl = window.localStorage.getItem(STORAGE_KEYS.baseUrl)?.trim() || "";
    const apiKey = window.localStorage.getItem(STORAGE_KEYS.apiKey)?.trim() || "";
    const model = window.localStorage.getItem(STORAGE_KEYS.model)?.trim() || "";

    return baseUrl && apiKey && model ? { baseUrl, apiKey, model } : null;
}

export function saveCustomAiConfig(config: CustomAiConfig): void {
    window.localStorage.setItem(STORAGE_KEYS.baseUrl, config.baseUrl.trim());
    window.localStorage.setItem(STORAGE_KEYS.apiKey, config.apiKey.trim());
    window.localStorage.setItem(STORAGE_KEYS.model, config.model.trim());
}

export function clearCustomAiConfig(): void {
    window.localStorage.removeItem(STORAGE_KEYS.baseUrl);
    window.localStorage.removeItem(STORAGE_KEYS.apiKey);
    window.localStorage.removeItem(STORAGE_KEYS.model);
}

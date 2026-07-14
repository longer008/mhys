import type { DivinationResult } from "./meihua";

export interface DivinationRecord {
    id: string;
    createdAt: string;
    question: string;
    result: DivinationResult;
    interpretation: string;
}

const HISTORY_STORAGE_KEY = "meihua_divination_history";
const MAX_HISTORY_RECORDS = 50;

function readHistory(): DivinationRecord[] {
    if (typeof window === "undefined") return [];

    const rawHistory = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!rawHistory) return [];

    try {
        const parsed: unknown = JSON.parse(rawHistory);
        return Array.isArray(parsed) ? parsed as DivinationRecord[] : [];
    } catch {
        return [];
    }
}

export function saveHistoryRecord(record: DivinationRecord): void {
    if (typeof window === "undefined") return;

    try {
        const history = readHistory().filter((item) => item.id !== record.id);
        window.localStorage.setItem(
            HISTORY_STORAGE_KEY,
            JSON.stringify([record, ...history].slice(0, MAX_HISTORY_RECORDS))
        );
    } catch (error) {
        console.warn("本地历史记录保存失败", error);
    }
}

export function getHistory(): DivinationRecord[] {
    return readHistory();
}

export function clearHistory(): void {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.removeItem(HISTORY_STORAGE_KEY);
    } catch (error) {
        console.warn("本地历史记录清空失败", error);
    }
}

export function deleteRecord(id: string): boolean {
    if (typeof window === "undefined") return false;

    const history = readHistory();
    const nextHistory = history.filter((record) => record.id !== id);
    if (nextHistory.length === history.length) return false;

    try {
        window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(nextHistory));
        return true;
    } catch (error) {
        console.warn("本地历史记录删除失败", error);
        return false;
    }
}

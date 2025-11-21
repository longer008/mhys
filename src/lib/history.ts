import { DivinationResult } from './meihua';

export interface DivinationRecord {
    id: string;
    timestamp: number;
    question: string;
    result: DivinationResult;
    interpretation: string;
}

const HISTORY_KEY = 'meihua_divination_history';

export function saveRecord(question: string, result: DivinationResult, interpretation: string): void {
    if (typeof window === 'undefined') return;

    const record: DivinationRecord = {
        id: Date.now().toString() + Math.random().toString(36).substring(2),
        timestamp: Date.now(),
        question,
        result,
        interpretation,
    };

    const history = getHistory();
    history.unshift(record); // Add to beginning
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function getHistory(): DivinationRecord[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(HISTORY_KEY);
    if (!stored) return [];
    try {
        return JSON.parse(stored);
    } catch (e) {
        console.error('Failed to parse history', e);
        return [];
    }
}

export function clearHistory(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(HISTORY_KEY);
}

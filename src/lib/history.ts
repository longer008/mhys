import type { DivinationResult } from './meihua';
import { getUserId } from './user';

export interface DivinationRecord {
    id: string;
    timestamp: number;
    question: string;
    result: DivinationResult;
    interpretation: string;
}

const HISTORY_KEY = 'meihua_divination_history';

/**
 * 保存占卜记录
 * 双写模式：先写入 localStorage，再异步同步到数据库
 */
export async function saveRecord(
    question: string,
    result: DivinationResult,
    interpretation: string
): Promise<void> {
    if (typeof window === 'undefined') return;

    const record: DivinationRecord = {
        id: Date.now().toString() + Math.random().toString(36).substring(2),
        timestamp: Date.now(),
        question,
        result,
        interpretation,
    };

    // 1. 先保存到 localStorage（保证离线可用）
    const history = getLocalHistory();
    history.unshift(record);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));

    // 2. 异步同步到数据库（静默失败）
    try {
        await syncToDatabase(question, result, interpretation);
    } catch (error) {
        console.warn('Failed to sync to database:', error);
        // 静默失败，不影响用户体验
    }
}

/**
 * 同步保存到数据库
 */
async function syncToDatabase(
    question: string,
    result: DivinationResult,
    interpretation: string
): Promise<void> {
    const response = await fetch('/api/divination/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, result, interpretation }),
    });

    if (!response.ok) {
        const data = await response.json();
        // 如果数据库未配置，静默忽略
        if (data.code === 'DB_DISABLED') {
            return;
        }
        throw new Error(data.error || 'Failed to save');
    }
}

/**
 * 获取本地历史记录
 */
export function getLocalHistory(): DivinationRecord[] {
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

/**
 * 获取历史记录（兼容旧接口）
 */
export function getHistory(): DivinationRecord[] {
    return getLocalHistory();
}

/**
 * 清空本地历史记录
 */
export function clearHistory(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(HISTORY_KEY);
}

/**
 * 删除单条记录
 */
export function deleteRecord(id: string): void {
    if (typeof window === 'undefined') return;
    const history = getLocalHistory();
    const newHistory = history.filter(record => record.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
}

/**
 * 检查数据库是否可用
 */
export async function isDatabaseEnabled(): Promise<boolean> {
    try {
        const response = await fetch('/api/stats');
        const data = await response.json();
        return data.enabled === true;
    } catch {
        return false;
    }
}

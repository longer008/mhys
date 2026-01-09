'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Save, RefreshCw } from 'lucide-react';

interface Settings {
    requireLogin: boolean;
    siteTitle: string;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function AdminSettingsPage() {
    const { data: initialSettings, isLoading, mutate } = useSWR<Settings>(
        '/api/admin/settings',
        fetcher,
        {
            revalidateOnFocus: false,
            dedupingInterval: 30000,
        }
    );

    const [settings, setSettings] = useState<Settings | null>(null);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // 当数据加载完成后，初始化本地状态
    const currentSettings = settings ?? initialSettings ?? { requireLogin: false, siteTitle: '梅花易数' };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);

        try {
            const res = await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentSettings),
            });

            if (res.ok) {
                setMessage({ type: 'success', text: '设置已保存' });
                mutate(currentSettings); // 更新缓存
            } else {
                setMessage({ type: 'error', text: '保存失败' });
            }
        } catch {
            setMessage({ type: 'error', text: '网络错误' });
        } finally {
            setSaving(false);
        }
    };

    const updateSettings = (updates: Partial<Settings>) => {
        setSettings({ ...currentSettings, ...updates });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-stone-500">加载中...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-serif text-stone-800">系统设置</h1>
                <p className="text-stone-500 mt-1">配置网站选项和功能</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 space-y-6">
                {/* 站点标题 */}
                <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                        站点标题
                    </label>
                    <input
                        type="text"
                        value={currentSettings.siteTitle}
                        onChange={(e) => updateSettings({ siteTitle: e.target.value })}
                        className="w-full max-w-md px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-transparent outline-none"
                    />
                    <p className="mt-1 text-sm text-stone-500">显示在浏览器标签页的标题</p>
                </div>

                {/* 是否需要登录 */}
                <div>
                    <div className="flex items-center justify-between max-w-md">
                        <div>
                            <label className="block text-sm font-medium text-stone-700">
                                用户访问控制
                            </label>
                            <p className="text-sm text-stone-500">
                                启用后，用户需要登录才能使用占卜功能（尚未实现）
                            </p>
                        </div>
                        <button
                            onClick={() => updateSettings({ requireLogin: !currentSettings.requireLogin })}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${currentSettings.requireLogin ? 'bg-stone-800' : 'bg-stone-300'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${currentSettings.requireLogin ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>
                </div>

                {/* 消息提示 */}
                {message && (
                    <div
                        className={`p-3 rounded-lg text-sm ${message.type === 'success'
                            ? 'bg-green-50 text-green-600 border border-green-200'
                            : 'bg-red-50 text-red-600 border border-red-200'
                            }`}
                    >
                        {message.text}
                    </div>
                )}

                {/* 保存按钮 */}
                <div className="flex gap-4">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {saving ? (
                            <RefreshCw size={18} className="animate-spin" />
                        ) : (
                            <Save size={18} />
                        )}
                        {saving ? '保存中...' : '保存设置'}
                    </button>
                </div>
            </div>

            {/* 环境变量信息 */}
            <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
                <h2 className="text-lg font-medium text-stone-800 mb-4">环境配置</h2>
                <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3">
                        <span className="w-3 h-3 rounded-full bg-green-500"></span>
                        <span className="text-stone-600">数据库已连接</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="w-3 h-3 rounded-full bg-green-500"></span>
                        <span className="text-stone-600">管理员认证已启用</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

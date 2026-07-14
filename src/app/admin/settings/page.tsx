'use client';

import useSWR from 'swr';
import { Database, KeyRound, Server } from 'lucide-react';
import { fetchApi } from '@/lib/api-client';

interface Settings {
    siteTitle: string;
}

const fetcher = (url: string) => fetchApi<Settings>(url);

export default function AdminSettingsPage() {
    const { data: settings, isLoading } = useSWR<Settings>(
        '/api/admin/settings',
        fetcher,
        {
            revalidateOnFocus: false,
            dedupingInterval: 30000,
        }
    );

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
                <p className="text-stone-500 mt-1">查看当前部署配置</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
                <h2 className="text-lg font-medium text-stone-800 mb-5">运行配置</h2>
                <div className="divide-y divide-stone-200 text-sm">
                    <div className="flex items-center gap-3 py-3">
                        <Server className="h-5 w-5 text-stone-500" />
                        <span className="text-stone-500">站点标题</span>
                        <span className="ml-auto font-medium text-stone-800">{settings?.siteTitle || '梅花易数'}</span>
                    </div>
                    <div className="flex items-center gap-3 py-3">
                        <Database className="h-5 w-5 text-stone-500" />
                        <span className="text-stone-600">数据库连接由 DATABASE_URL 管理</span>
                    </div>
                    <div className="flex items-center gap-3 py-3">
                        <KeyRound className="h-5 w-5 text-stone-500" />
                        <span className="text-stone-600">管理员认证由环境变量管理</span>
                    </div>
                </div>
                <p className="mt-4 text-xs leading-5 text-stone-500">修改 Vercel 环境变量后需重新部署才能生效。</p>
            </div>
        </div>
    );
}

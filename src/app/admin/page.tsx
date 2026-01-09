'use client';

import useSWR from 'swr';
import { Users, FileText, Calendar, TrendingUp } from 'lucide-react';

interface Stats {
    totalUsers: number;
    totalDivinations: number;
    todayDivinations: number;
    enabled: boolean;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function AdminDashboard() {
    const { data: stats, isLoading } = useSWR<Stats>('/api/stats', fetcher, {
        revalidateOnFocus: false,
        dedupingInterval: 30000, // 30秒内不重复请求
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-stone-500">加载中...</div>
            </div>
        );
    }

    const statCards = [
        {
            title: '总用户数',
            value: stats?.totalUsers || 0,
            icon: Users,
            color: 'bg-blue-500',
            description: '累计访问用户',
        },
        {
            title: '总起卦次数',
            value: stats?.totalDivinations || 0,
            icon: FileText,
            color: 'bg-green-500',
            description: '累计占卜记录',
        },
        {
            title: '今日起卦',
            value: stats?.todayDivinations || 0,
            icon: Calendar,
            color: 'bg-orange-500',
            description: '今日新增记录',
        },
        {
            title: '平均使用',
            value: stats?.totalUsers
                ? (stats.totalDivinations / stats.totalUsers).toFixed(1)
                : '0',
            icon: TrendingUp,
            color: 'bg-purple-500',
            description: '人均起卦次数',
        },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-serif text-stone-800">仪表盘</h1>
                <p className="text-stone-500 mt-1">查看网站统计数据</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((card, index) => (
                    <div
                        key={index}
                        className="bg-white rounded-xl shadow-sm border border-stone-200 p-6"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-stone-500">{card.title}</p>
                                <p className="text-3xl font-bold text-stone-800 mt-2">
                                    {card.value}
                                </p>
                                <p className="text-xs text-stone-400 mt-1">{card.description}</p>
                            </div>
                            <div className={`p-3 rounded-lg ${card.color}`}>
                                <card.icon className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
                <h2 className="text-lg font-medium text-stone-800 mb-4">快速操作</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <a
                        href="/admin/records"
                        className="p-4 border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors"
                    >
                        <FileText className="w-6 h-6 text-stone-600 mb-2" />
                        <h3 className="font-medium text-stone-800">查看记录</h3>
                        <p className="text-sm text-stone-500">浏览所有占卜记录</p>
                    </a>
                    <a
                        href="/admin/settings"
                        className="p-4 border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors"
                    >
                        <TrendingUp className="w-6 h-6 text-stone-600 mb-2" />
                        <h3 className="font-medium text-stone-800">系统设置</h3>
                        <p className="text-sm text-stone-500">配置网站选项</p>
                    </a>
                    <a
                        href="/"
                        target="_blank"
                        className="p-4 border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors"
                    >
                        <Users className="w-6 h-6 text-stone-600 mb-2" />
                        <h3 className="font-medium text-stone-800">访问前台</h3>
                        <p className="text-sm text-stone-500">查看用户界面</p>
                    </a>
                </div>
            </div>
        </div>
    );
}

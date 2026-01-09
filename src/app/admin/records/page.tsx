'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Search, Trash2, ChevronLeft, ChevronRight, Eye } from 'lucide-react';

interface Record {
    id: string;
    user_id: string;
    question: string | null;
    result: {
        main?: { upper?: { name?: string }; lower?: { name?: string } };
        changed?: { upper?: { name?: string }; lower?: { name?: string } };
    };
    interpretation: string | null;
    created_at: string;
}

interface RecordsResponse {
    records: Record[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function AdminRecordsPage() {
    const [search, setSearch] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [selectedRecord, setSelectedRecord] = useState<Record | null>(null);

    const apiUrl = `/api/admin/records?page=${page}&pageSize=20${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}`;

    const { data, isLoading, mutate } = useSWR<RecordsResponse>(
        apiUrl,
        fetcher,
        {
            revalidateOnFocus: false,
            dedupingInterval: 10000,
        }
    );

    const handleDelete = async (id: string) => {
        if (!confirm('确定要删除这条记录吗？')) return;

        try {
            const res = await fetch('/api/admin/records', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });

            if (res.ok) {
                mutate(); // 重新获取数据
            }
        } catch (error) {
            console.error('Failed to delete record:', error);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        setSearchQuery(search);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getGuaName = (record: Record) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = record.result as any;
        if (!result) return '未知卦象';

        const main = result.main;
        const changed = result.changed;

        if (main?.upper?.name && main?.lower?.name) {
            let name = `${main.upper.name}${main.lower.name}`;
            if (changed?.upper?.name && changed?.lower?.name) {
                name += ` → ${changed.upper.name}${changed.lower.name}`;
            }
            return name;
        }

        // 备选：如果数据被嵌套了一层（兼容旧数据）
        if (typeof result === 'string') {
            try {
                const parsed = JSON.parse(result);
                if (parsed?.main?.upper?.name && parsed?.main?.lower?.name) {
                    let name = `${parsed.main.upper.name}${parsed.main.lower.name}`;
                    if (parsed?.changed?.upper?.name && parsed?.changed?.lower?.name) {
                        name += ` → ${parsed.changed.upper.name}${parsed.changed.lower.name}`;
                    }
                    return name;
                }
            } catch {
                // 解析失败
            }
        }

        return '未知卦象';
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-serif text-stone-800">占卜记录</h1>
                <p className="text-stone-500 mt-1">查看和管理所有用户的占卜记录</p>
            </div>

            {/* 搜索栏 */}
            <form onSubmit={handleSearch} className="flex gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="搜索问题..."
                        className="w-full pl-10 pr-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-transparent outline-none"
                    />
                </div>
                <button
                    type="submit"
                    className="px-6 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition-colors"
                >
                    搜索
                </button>
            </form>

            {/* 记录列表 */}
            <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center text-stone-500">加载中...</div>
                ) : data?.records.length === 0 ? (
                    <div className="p-8 text-center text-stone-500">暂无记录</div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-stone-50 border-b border-stone-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">
                                            时间
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">
                                            问题
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">
                                            卦象
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">
                                            用户ID
                                        </th>
                                        <th className="px-4 py-3 text-right text-sm font-medium text-stone-600">
                                            操作
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-200">
                                    {data?.records.map((record) => (
                                        <tr key={record.id} className="hover:bg-stone-50">
                                            <td className="px-4 py-3 text-sm text-stone-600 whitespace-nowrap">
                                                {formatDate(record.created_at)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-stone-800 max-w-xs truncate">
                                                {record.question || '未填写'}
                                            </td>
                                            <td className="px-4 py-3 text-sm font-serif text-stone-800">
                                                {getGuaName(record)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-stone-500 font-mono">
                                                {record.user_id.slice(0, 8)}...
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => setSelectedRecord(record)}
                                                        className="p-2 text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
                                                        title="查看详情"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(record.id)}
                                                        className="p-2 text-stone-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="删除"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* 分页 */}
                        {data && data.totalPages > 1 && (
                            <div className="px-4 py-3 border-t border-stone-200 flex items-center justify-between">
                                <div className="text-sm text-stone-500">
                                    共 {data.total} 条记录，第 {data.page} / {data.totalPages} 页
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="p-2 border border-stone-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stone-50 transition-colors"
                                    >
                                        <ChevronLeft size={18} />
                                    </button>
                                    <button
                                        onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                                        disabled={page === data.totalPages}
                                        className="p-2 border border-stone-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stone-50 transition-colors"
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* 详情弹窗 */}
            {selectedRecord && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-stone-200 flex items-center justify-between">
                            <h3 className="text-lg font-medium text-stone-800">记录详情</h3>
                            <button
                                onClick={() => setSelectedRecord(null)}
                                className="text-stone-500 hover:text-stone-700"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto space-y-4">
                            <div>
                                <label className="text-sm text-stone-500">时间</label>
                                <p className="text-stone-800">{formatDate(selectedRecord.created_at)}</p>
                            </div>
                            <div>
                                <label className="text-sm text-stone-500">问题</label>
                                <p className="text-stone-800">{selectedRecord.question || '未填写'}</p>
                            </div>
                            <div>
                                <label className="text-sm text-stone-500">卦象</label>
                                <p className="text-stone-800 font-serif">{getGuaName(selectedRecord)}</p>
                            </div>
                            <div>
                                <label className="text-sm text-stone-500">解卦结果</label>
                                <div className="mt-1 p-3 bg-stone-50 rounded-lg text-sm text-stone-700 whitespace-pre-wrap max-h-64 overflow-y-auto">
                                    {selectedRecord.interpretation || '暂无解卦'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

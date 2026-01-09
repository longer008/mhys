'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, FileText, Settings, LogOut, Menu, X } from 'lucide-react';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [dbEnabled, setDbEnabled] = useState<boolean>(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        checkAuth();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const checkAuth = async () => {
        try {
            const res = await fetch('/api/admin/auth');
            const data = await res.json();
            setDbEnabled(data.dbEnabled);
            setIsAuthenticated(data.authenticated);

            if (!data.dbEnabled) {
                // 数据库未启用，重定向到 404
                router.replace('/not-found');
            } else if (!data.authenticated && pathname !== '/admin/login') {
                router.replace('/admin/login');
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            setIsAuthenticated(false);
        }
    };

    const handleLogout = async () => {
        await fetch('/api/admin/auth', { method: 'DELETE' });
        router.replace('/admin/login');
    };

    // 加载中
    if (isAuthenticated === null) {
        return (
            <div className="min-h-screen bg-stone-100 flex items-center justify-center">
                <div className="text-stone-500">加载中...</div>
            </div>
        );
    }

    // 数据库未启用
    if (!dbEnabled) {
        return null;
    }

    // 登录页面
    if (pathname === '/admin/login') {
        return <>{children}</>;
    }

    // 未登录
    if (!isAuthenticated) {
        return null;
    }

    const navItems = [
        { href: '/admin', icon: LayoutDashboard, label: '仪表盘' },
        { href: '/admin/records', icon: FileText, label: '占卜记录' },
        { href: '/admin/settings', icon: Settings, label: '系统设置' },
    ];

    return (
        <div className="min-h-screen bg-stone-100">
            {/* 移动端菜单按钮 */}
            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
            >
                {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* 侧边栏 */}
            <aside
                className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    } lg:translate-x-0`}
            >
                <div className="flex flex-col h-full">
                    <div className="p-6 border-b border-stone-200">
                        <h1 className="text-xl font-serif text-stone-800">梅花易数</h1>
                        <p className="text-sm text-stone-500">后台管理</p>
                    </div>

                    <nav className="flex-1 p-4 space-y-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                        ? 'bg-stone-800 text-white'
                                        : 'text-stone-600 hover:bg-stone-100'
                                        }`}
                                >
                                    <item.icon size={20} />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="p-4 border-t border-stone-200">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full px-4 py-3 text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
                        >
                            <LogOut size={20} />
                            <span>退出登录</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* 遮罩层（移动端） */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* 主内容区 */}
            <main className="lg:ml-64 min-h-screen">
                <div className="p-6 lg:p-8">{children}</div>
            </main>
        </div>
    );
}

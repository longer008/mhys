"use client";

import { usePathname } from 'next/navigation';

export default function Footer() {
    const pathname = usePathname();

    if (pathname.startsWith('/admin')) {
        return null;
    }

    return (
        <footer className="frontend-theme mt-auto w-full px-4 pb-5 text-center sm:px-6 lg:px-10">
            <div className="mx-auto flex max-w-[1380px] items-center justify-between border-t border-border/70 pt-5 text-xs text-muted-foreground">
                <p className="tracking-[0.08em]">
                    © {new Date().getFullYear()} 梅花易数
                </p>
                <p className="hidden tracking-[0.16em] sm:block">观象授时 · 万物皆数</p>
            </div>
        </footer>
    );
}
